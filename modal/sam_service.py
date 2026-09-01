"""Private SAM 3 text-prompt image-segmentation API for Housora on Modal.

Deploy with:
    modal deploy modal/sam_service.py

The endpoint accepts a base64 data URL plus a text prompt and returns PNG masks,
boxes, and confidence scores. Modal proxy authentication is required so the
endpoint cannot be used by strangers at Housora's expense.
"""

from __future__ import annotations

import base64
import io
from typing import Any

import modal


APP_NAME = "housora-sam-3"
MODEL_ID = "facebook/sam3"
MODEL_FILENAME = "sam3.pt"
HF_CACHE_DIR = "/cache/huggingface"
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_IMAGE_PIXELS = 25_000_000

app = modal.App(APP_NAME)

# SAM 3 requires the official repository, Python 3.12+, PyTorch 2.7+
# and CUDA 12.6+. The CUDA runtime and GPU are supplied by Modal.
sam_image = (
    modal.Image.from_registry(
        "nvidia/cuda:12.8.1-runtime-ubuntu22.04",
        add_python="3.12",
    )
    .apt_install("git", "libgl1", "libglib2.0-0")
    .pip_install(
        "torch==2.10.0",
        "torchvision",
        extra_index_url="https://download.pytorch.org/whl/cu128",
    )
    .uv_pip_install(
        "fastapi[standard]>=0.115,<1",
        "huggingface-hub>=0.30,<2",
        "numpy>=2,<3",
        "pillow>=11,<12",
        "pydantic>=2,<3",
        "git+https://github.com/facebookresearch/sam3.git",
    )
    .env({"HF_HOME": HF_CACHE_DIR})
)

model_cache = modal.Volume.from_name("housora-sam-model-cache", create_if_missing=True)
hf_secret = modal.Secret.from_name("housora-sam-huggingface")


def _decode_image(data_url: str):
    from fastapi import HTTPException
    from PIL import Image, UnidentifiedImageError

    if not data_url.startswith("data:image/") or ";base64," not in data_url:
        raise HTTPException(
            status_code=400,
            detail="image must be a base64 data URL (PNG, JPEG, or WebP)",
        )

    header, encoded = data_url.split(",", 1)
    allowed_headers = {
        "data:image/png;base64",
        "data:image/jpeg;base64",
        "data:image/jpg;base64",
        "data:image/webp;base64",
    }
    if header.lower() not in allowed_headers:
        raise HTTPException(status_code=415, detail="unsupported image type")

    try:
        image_bytes = base64.b64decode(encoded, validate=True)
    except (ValueError, base64.binascii.Error) as exc:
        raise HTTPException(status_code=400, detail="invalid base64 image") from exc

    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="image must be 10 MB or smaller")

    try:
        Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
        return image.convert("RGB")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise HTTPException(status_code=400, detail="invalid or unsafe image") from exc


def _mask_to_data_url(mask: Any) -> str:
    import numpy as np
    from PIL import Image

    if hasattr(mask, "detach"):
        mask = mask.detach().float().cpu().numpy()
    mask = np.asarray(mask).squeeze()
    png = Image.fromarray((mask > 0).astype(np.uint8) * 255, mode="L")
    output = io.BytesIO()
    png.save(output, format="PNG", optimize=True)
    encoded = base64.b64encode(output.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


@app.cls(
    image=sam_image,
    gpu="L4",
    timeout=180,
    min_containers=0,
    max_containers=2,
    scaledown_window=300,
    volumes={HF_CACHE_DIR: model_cache},
    secrets=[hf_secret],
)
@modal.concurrent(max_inputs=1)
class SamSegmenter:
    @modal.enter()
    def load_model(self) -> None:
        import torch
        from huggingface_hub import hf_hub_download
        from sam3.model.sam3_image_processor import Sam3Processor
        from sam3.model_builder import build_sam3_image_model

        checkpoint_path = hf_hub_download(
            repo_id=MODEL_ID,
            filename=MODEL_FILENAME,
            token=True,
        )
        self.device = "cuda"
        self.model = build_sam3_image_model(
            checkpoint_path=checkpoint_path,
            load_from_HF=False,
            device=self.device,
            eval_mode=True,
        )
        self.processor = Sam3Processor(self.model)
        self.torch = torch

    @modal.fastapi_endpoint(
        method="POST",
        docs=True,
        requires_proxy_auth=True,
    )
    def segment(self, payload: dict[str, Any]) -> dict[str, Any]:
        from fastapi import HTTPException

        image_value = payload.get("image")
        prompt_value = payload.get("prompt") or payload.get("object")
        if not isinstance(image_value, str):
            raise HTTPException(status_code=422, detail="image is required")
        if not isinstance(prompt_value, str) or not prompt_value.strip():
            raise HTTPException(status_code=422, detail="prompt is required")

        prompt = prompt_value.strip()
        if len(prompt) > 160:
            raise HTTPException(status_code=422, detail="prompt is too long")

        try:
            threshold = float(payload.get("threshold", 0.45))
            max_masks = int(payload.get("max_masks", 8))
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=422, detail="invalid options") from exc
        threshold = min(max(threshold, 0.05), 0.95)
        max_masks = min(max(max_masks, 1), 12)
        image = _decode_image(image_value)

        with self.torch.inference_mode(), self.torch.autocast(
            device_type="cuda", dtype=self.torch.bfloat16
        ):
            state = self.processor.set_image(image)
            output = self.processor.set_text_prompt(state=state, prompt=prompt)

        masks = output["masks"].detach().float().cpu()
        boxes = output["boxes"].detach().float().cpu()
        scores = output["scores"].detach().float().cpu()

        keep = scores >= threshold
        masks, boxes, scores = masks[keep], boxes[keep], scores[keep]
        if scores.numel():
            order = self.torch.argsort(scores, descending=True)[:max_masks]
            masks, boxes, scores = masks[order], boxes[order], scores[order]

        mask_urls = [_mask_to_data_url(mask) for mask in masks]
        union_mask = masks.bool().any(dim=0) if masks.numel() else self.torch.zeros(
            (image.height, image.width), dtype=self.torch.bool
        )

        return {
            "mask": _mask_to_data_url(union_mask),
            "masks": [{"url": url} for url in mask_urls],
            "scores": scores.tolist(),
            "boxes": boxes.tolist(),
            "prompt": prompt,
            "width": image.width,
            "height": image.height,
            "model": "sam-3",
        }
