# Housora SAM 3 on Modal

This service exposes a private text-prompt segmentation endpoint for Housora.

## Automatic detection

Redeploy `sam_service.py` after this update; the previous endpoint only accepted
one named object. The new `auto_detect: true` mode encodes the image once, runs a
bounded room/outdoor vocabulary through SAM, filters actual masks by confidence,
deduplicates overlapping boxes, and returns up to 24 real cropped objects.
This is model inference, not a list of placeholder furniture. It is not guaranteed
to find every possible object category. Empty results remain empty.

Requests require Modal proxy auth. Configure `MODAL_SAM_ENDPOINT`,
`MODAL_PROXY_KEY`, and `MODAL_PROXY_SECRET` in Vercel for this project, and
in `.env.local` for local tests. Never commit these values. Redeploy Vercel after
environment changes. First inference can take longer because the GPU starts cold.

## One-time setup

1. Request/accept access to `facebook/sam3` on Hugging Face.
2. Create a Hugging Face read token.
3. Install and authenticate the Modal CLI:

   ```powershell
   py -m pip install modal
   py -m modal setup
   ```

4. Store the token in Modal (replace the placeholder locally):

   ```powershell
   py -m modal secret create housora-sam-huggingface HF_TOKEN=hf_your_token
   ```

5. Deploy:

   ```powershell
   py -m modal deploy modal/sam_service.py
   ```

Modal will print the endpoint URL. Because the endpoint uses Modal proxy auth,
create a Modal proxy token and keep its ID and secret only in Vercel server-side
environment variables. Never expose them with a `NEXT_PUBLIC_` prefix.
