"""Background sender: 50 SaaS/tech pitches, Vibe3D-style, 30s spacing, incremental log."""
import base64, json, os, time
from datetime import datetime
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from googleapiclient.errors import HttpError
import googleapiclient.discovery as d

BASE = r"C:\Users\LENOVO\Desktop\Housora\computer-use\gmail-api"
TOKEN = os.path.join(BASE, "token.json")
LOG = r"C:\Users\LENOVO\Desktop\Housora\outputs\sent-log-saas.json"
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.compose"]
ME = "abismail2003@gmail.com"
DELAY = 30

def draft(brand, note):
    return f"""Hi {brand} team,

I'm Ismail, a Morocco-based creator behind Housora (@housora_ai), an interior-design inspiration page with 14K Instagram followers and 2.4M views in the last 30 days. My content mainly uses AI-assisted interior visualizations and room transformations, so {brand} feels particularly relevant.

I'd love to explore a paid Reel demonstrating a room workflow with {brand}. {note} I would test the tool first so the demonstration stays accurate and useful.

Does your sponsored-content program work with creators for a monetary fee? My audience is mainly women aged 45-64 in the US and UK, and I'm happy to share audience insights and develop a concept together. Please forward this to your creator team if needed.

Best,
Ismail | Housora
https://www.instagram.com/housora_ai/"""

def main():
    brands = json.load(open(os.path.join(BASE, "saas_a.json"), encoding="utf-8"))
    brands += json.load(open(os.path.join(BASE, "saas_b.json"), encoding="utf-8"))
    log = json.load(open(LOG, encoding="utf-8")) if os.path.exists(LOG) else []
    done = {e["email"].lower() for e in log if e.get("status") == "sent"}
    creds = Credentials.from_authorized_user_file(TOKEN, SCOPES)
    svc = d.build("gmail", "v1", credentials=creds)
    for b in brands:
        if b["email"].lower() in done:
            continue
        msg = MIMEText(draft(b["brand"], b["note"]))
        msg["From"] = ME
        msg["To"] = b["email"]
        msg["Subject"] = f"Paid Instagram Reel Collaboration with Housora x {b['brand']}"
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        entry = {"brand": b["brand"], "email": b["email"], "website": b["website"],
                 "time": datetime.now().isoformat()}
        for attempt in range(4):
            try:
                r = svc.users().messages().send(userId="me", body={"raw": raw}).execute()
                entry.update(status="sent", id=r.get("id"))
                print(f"SENT {b['brand']}", flush=True)
                break
            except HttpError as e:
                code = getattr(e.resp, "status", "?")
                entry.update(status="error", error=f"HTTP {code}: {str(e)[:150]}")
                print(f"FAIL {b['brand']} HTTP {code}", flush=True)
                if code in (403, 429):
                    log.append(entry)
                    json.dump(log, open(LOG, "w", encoding="utf-8"), indent=2)
                    print("RATE LIMITED, stopping", flush=True)
                    return
                break
            except Exception as e:
                print(f"RETRY {b['brand']} {type(e).__name__} {attempt+1}", flush=True)
                entry.update(status="error", error=f"{type(e).__name__}: {str(e)[:150]}")
                time.sleep(60)
        log.append(entry)
        json.dump(log, open(LOG, "w", encoding="utf-8"), indent=2)
        time.sleep(DELAY)
    print("ALL DONE", flush=True)

if __name__ == "__main__":
    main()
