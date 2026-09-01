# Housora SAM 3 on Modal

This service exposes a private text-prompt segmentation endpoint for Housora.

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
