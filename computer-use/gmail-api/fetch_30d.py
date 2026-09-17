"""Background fetch: all Gmail last-30d (no browser). Lists collab brands you contacted + contacted you."""
import json, os, re
from collections import Counter
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

BASE = os.path.dirname(os.path.abspath(__file__))
TOKEN = os.path.join(BASE, "token.json")
OUT = r"C:\Users\LENOVO\Desktop\Housora\outputs\gmail-30d-brands.json"

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.compose"]

def hdr(payload, name):
    for h in payload.get("headers", []):
        if h.get("name", "").lower() == name.lower():
            return h.get("value", "")
    return ""

def main():
    creds = Credentials.from_authorized_user_file(TOKEN, SCOPES)
    svc = build("gmail", "v1", credentials=creds)
    # two queries: sent collab + inbox received
    queries = {
        "sent": "in:sent newer_than:30d",
        "inbox": "in:inbox newer_than:30d",
    }
    all_data = {}
    for key, q in queries.items():
        ids, page = [], None
        while True:
            r = svc.users().messages().list(userId="me", q=q, maxResults=500, pageToken=page).execute()
            ids += [m["id"] for m in r.get("messages", [])]
            page = r.get("nextPageToken")
            if not page or len(ids) >= 1000:
                break
        print(f"{key}: {len(ids)} msgs", flush=True)
        rows = []
        for i, mid in enumerate(ids):
            m = svc.users().messages().get(userId="me", id=mid, format="metadata",
                metadataHeaders=["From", "To", "Subject", "Date"]).execute()
            p = m.get("payload", {})
            rows.append({"from": hdr(p, "From"), "to": hdr(p, "To"),
                         "subject": hdr(p, "Subject"), "date": hdr(p, "Date")})
            if (i + 1) % 100 == 0:
                print(f"  {key} {i+1}/{len(ids)}", flush=True)
        all_data[key] = rows
    # brand extraction: Housora x BRAND in subject, else From domain
    def brand_of(r):
        s = r.get("subject", "")
        m = re.search(r"Housora\s*x\s*([^—\-–|]+)", s, re.I)
        if m:
            return m.group(1).strip()[:60]
        f = r.get("from", "")
        m2 = re.search(r"@([\w\.-]+)", f)
        return (m2.group(1) if m2 else f[:60]).strip()
    for k in all_data:
        for r in all_data[k]:
            r["brand"] = brand_of(r)
    json.dump(all_data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"saved {OUT}", flush=True)
    for k in ("sent", "inbox"):
        c = Counter(r["brand"] for r in all_data[k])
        print(f"\n== {k.upper()} top brands ==", flush=True)
        for b, n in c.most_common(60):
            print(f"{n:3d}  {b}", flush=True)

if __name__ == "__main__":
    main()
