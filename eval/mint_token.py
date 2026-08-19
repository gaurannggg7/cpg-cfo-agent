#!/usr/bin/env python3
"""
mint_token.py — mint a Firebase anonymous ID token for the eval harness.

Baseline's /analyze requires `Authorization: Bearer <firebase-id-token>`
(backend/auth.py). Anonymous/guest tokens are accepted, so the harness can
authenticate headlessly without a browser.

Reads the Firebase Web API key from, in order:
  1. FIREBASE_API_KEY env var
  2. frontend/.env.local -> NEXT_PUBLIC_FIREBASE_API_KEY   (gitignored)

No secret is ever written into a tracked file. Prints the token to stdout:

    export BASELINE_TOKEN="$(python3 eval/mint_token.py)"

Tokens expire after ~1 hour; re-run when a long eval starts returning 401.
"""
import os
import re
import sys
import json
import urllib.request

ENDPOINT = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={key}"


def _api_key() -> str:
    key = os.environ.get("FIREBASE_API_KEY")
    if key:
        return key

    here = os.path.dirname(os.path.abspath(__file__))
    env_local = os.path.join(here, "..", "frontend", ".env.local")
    try:
        with open(env_local) as f:
            m = re.search(r"^NEXT_PUBLIC_FIREBASE_API_KEY=(.+)$", f.read(), re.M)
            if m:
                return m.group(1).strip().strip('"').strip("'")
    except FileNotFoundError:
        pass

    sys.exit(
        "No Firebase API key. Set FIREBASE_API_KEY, or ensure "
        "frontend/.env.local defines NEXT_PUBLIC_FIREBASE_API_KEY."
    )


def main() -> None:
    req = urllib.request.Request(
        ENDPOINT.format(key=_api_key()),
        data=json.dumps({"returnSecureToken": True}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = json.load(resp)
    except Exception as exc:
        sys.exit(f"Token mint failed: {exc}")

    token = body.get("idToken")
    if not token:
        sys.exit(f"No idToken in response: {body}")
    print(token)


if __name__ == "__main__":
    main()
