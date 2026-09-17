"""Edge browser automation via Playwright (uses installed MS Edge).
I (the agent) keep the browser open in one Python run for multi-step tasks.
CLI quick use:
  python browser_edge.py --url https://example.com --shot outputs/shots/edge.png
Library use (for tasks):
  from browser_edge import launch_edge
  with launch_edge(headless=False) as (page, browser):
      page.goto("https://example.com")
"""
import argparse
import os
from contextlib import contextmanager
from playwright.sync_api import sync_playwright

EDGE_EXE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

@contextmanager
def launch_edge(headless=False, slow_mo=150):
    with sync_playwright() as pw:
        try:
            browser = pw.chromium.launch(channel="msedge", headless=headless, slow_mo=slow_mo)
        except Exception:
            # fallback to explicit exe path
            browser = pw.chromium.launch(executable_path=EDGE_EXE, headless=headless, slow_mo=slow_mo)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        try:
            yield page, browser
        finally:
            try:
                browser.close()
            except Exception:
                pass

def one_shot(url, shot_path, headless=False, wait_ms=2000):
    shot_path = os.path.abspath(shot_path)
    os.makedirs(os.path.dirname(shot_path), exist_ok=True)
    with launch_edge(headless=headless) as (page, _):
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(wait_ms)
        title = page.title()
        try:
            body = page.inner_text("body")[:2000]
        except Exception:
            body = ""
        page.screenshot(path=shot_path)
        print(f"TITLE: {title}")
        print(f"SHOT: {shot_path}")
        print(f"BODY:\n{body[:1000]}")
        return shot_path

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="https://example.com")
    ap.add_argument("--shot", default="outputs/shots/edge-test.png")
    ap.add_argument("--headless", default="false", choices=["true", "false"])
    ap.add_argument("--wait-ms", type=int, default=2000)
    args = ap.parse_args()
    one_shot(args.url, args.shot, headless=(args.headless == "true"), wait_ms=args.wait_ms)
