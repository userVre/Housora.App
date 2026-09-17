"""Quiet check: token exists? scopes? 1 read-only API call. No browser, no send."""
import json, os
BASE = os.path.dirname(os.path.abspath(__file__))
TOKEN = os.path.join(BASE, "token.json")
print("token exists:", os.path.exists(TOKEN))
if os.path.exists(TOKEN):
    d = json.load(open(TOKEN))
    print("scopes:", d.get("scopes"))
    print("expiry:", d.get("expiry"))
try:
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    SCOPES = ["https://www.googleapis.com/auth/gmail.readonly",
              "https://www.googleapis.com/auth/gmail.send",
              "https://www.googleapis.com/auth/gmail.compose"]
    creds = Credentials.from_authorized_user_file(TOKEN, SCOPES)
    svc = build("gmail", "v1", credentials=creds)
    prof = svc.users().getProfile(userId="me").execute()
    print("READ OK:", prof.get("emailAddress"), "total:", prof.get("messagesTotal"))
    r = svc.users().messages().list(userId="me", q="newer_than:30d", maxResults=1).execute()
    print("SEARCH OK:", r.get("resultSizeEstimate"), "msgs")
    print("SEND CAPABLE:", "gmail.send" in (d.get("scopes") or []) or "mail.google" in str(d.get("scopes")))
except Exception as e:
    print("CHECK FAIL:", type(e).__name__, str(e)[:300])
