"""One-time Gmail OAuth (Desktop app). Run me, browser opens, log in as abismail2003@gmail.com, click Allow. Saves token.json (background reuse, no more browser)."""
import os
from google_auth_oauthlib.flow import InstalledAppFlow

BASE = os.path.dirname(os.path.abspath(__file__))
CRED = os.path.join(BASE, "credentials.json")
TOKEN = os.path.join(BASE, "token.json")
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.compose"]

def main():
    if not os.path.exists(CRED):
        print(f"MISSING: {CRED}")
        print("Download OAuth Desktop client JSON from Google Cloud and save it as credentials.json, then re-run.")
        return
    flow = InstalledAppFlow.from_client_secrets_file(CRED, SCOPES)
    creds = flow.run_local_server(port=8765, open_browser=True)
    open(TOKEN, "w").write(creds.to_json())
    print(f"OK saved {TOKEN}")

if __name__ == "__main__":
    main()
