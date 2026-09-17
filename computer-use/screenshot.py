"""Take a desktop screenshot. I (the agent) can Read the output PNG to see the screen."""
import argparse
import os
from datetime import datetime
import mss
from PIL import Image

def take_screenshot(out_path=None):
    if out_path is None:
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        out_path = os.path.join(os.path.dirname(__file__), "..", "outputs", "shots", f"shot-{ts}.png")
    out_path = os.path.abspath(out_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with mss.mss() as sct:
        shot = sct.shot(output=out_path)
    # downscale very large shots for faster reading
    try:
        with Image.open(out_path) as im:
            w, h = im.size
            if w > 1600:
                ratio = 1600 / w
                im = im.resize((1600, int(h * ratio)))
                im.save(out_path)
    except Exception as e:
        print(f"warn: resize skipped: {e}")
    print(out_path)
    return out_path

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=None, help="output PNG path")
    args = ap.parse_args()
    take_screenshot(args.out)
