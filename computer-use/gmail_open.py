"""Open Gmail with Edge Default profile (Profil 1 / abismail2003@gmail.com)."""
import os
from playwright.sync_api import sync_playwright

USER_DATA = r"C:\Users\LENOVO\AppData\Local\Microsoft\Edge\User Data"
PROFILE = "Default"  # display name "Profil 1", email abismail2003@gmail.com
OUT = r"C:\Users\LENOVO\Desktop\Housora\outputs\shots\gmail-inbox.png"

os.makedirs(os.path.dirname(OUT), exist_ok=True)

with sync_playwright() as pw:
    ctx = pw.chromium.launch_persistent_context(
        USER_DATA,
        channel="msedge",
        headless=False,
        slow_mo=200,
        args=[f"--profile-directory={PROFILE}", "--no-first-run"],
        viewport={"width": 1280, "height": 800},
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto("https://mail.google.com/mail/u/0/", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(6000)
    print("TITLE:", page.title())
    print("URL:", page.url)
    try:
        body = page.inner_text("body")[:3000]
        print("BODY:\n", body[:2000])
    except Exception as e:
        print("body read fail:", e)
    page.screenshot(path=OUT)
    print("SHOT:", OUT)
    # keep open 5s for visual, then close context (Edge stays unlocked after)
    page.wait_for_timeout(3000)
    ctx.close()
