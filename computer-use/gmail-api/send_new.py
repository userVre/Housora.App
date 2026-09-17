"""Background sender: 52 verified new brands, 30s spacing, incremental log. No browser."""
import base64, json, os, time
from datetime import datetime
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from googleapiclient.errors import HttpError
import googleapiclient.discovery as d

BASE = r"C:\Users\LENOVO\Desktop\Housora\computer-use\gmail-api"
TOKEN = os.path.join(BASE, "token.json")
LOG = r"C:\Users\LENOVO\Desktop\Housora\outputs\sent-log.json"
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.compose"]
ME = "abismail2003@gmail.com"
DELAY = 30

def draft(brand, note):
    return f"""Hi {brand} team,

I'm Ismail, creator of Housora (@housora_ai), an interior-design inspiration page with 13.8K Instagram followers and 2.4M+ views. My audience is primarily women aged 45-64, mainly based in the US and UK.

I'd love to create a paid Instagram Reel featuring {brand}'s products through a realistic room transformation or styling concept. {note} Your products would be a natural fit for my audience and visual content style.

Could you connect me with the person handling influencer or creator partnerships? I'd be happy to share content ideas, rates, and insights.

Best regards,
Ismail
Housora
Instagram: https://www.instagram.com/housora_ai/"""

def main():
    brands = json.load(open(os.path.join(BASE, "final_a.json"), encoding="utf-8"))
    brands += json.load(open(os.path.join(BASE, "final_b.json"), encoding="utf-8"))
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
        entry = {"brand": b["brand"], "email": b["email"], "category": b["category"],
                 "website": b["website"], "time": datetime.now().isoformat()}
        for attempt in range(4):
            try:
                r = svc.users().messages().send(userId="me", body={"raw": raw}).execute()
                entry.update(status="sent", id=r.get("id"))
                print(f"SENT {b['brand']} -> {b['email']}", flush=True)
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
                print(f"RETRY {b['brand']} {type(e).__name__} attempt {attempt+1}", flush=True)
                entry.update(status="error", error=f"{type(e).__name__}: {str(e)[:150]}")
                time.sleep(60)
        else:
            pass
        log.append(entry)
        json.dump(log, open(LOG, "w", encoding="utf-8"), indent=2)
        time.sleep(DELAY)
    print("ALL DONE", flush=True)

if __name__ == "__main__":
    main()
