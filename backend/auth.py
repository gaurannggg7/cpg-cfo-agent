"""
auth.py — Firebase ID-token verification for protected FastAPI endpoints.

Every caller of a protected endpoint must send a Firebase ID token:

    Authorization: Bearer <id-token>

Anonymous (guest) Firebase users are accepted: signInAnonymously() issues a
normal ID token, so the public demo keeps working while unauthenticated
callers — anyone hitting the API without a Firebase identity at all — are
rejected.

Credential resolution, in priority order:
  1. FIREBASE_SERVICE_ACCOUNT_BASE64 — base64-encoded service-account JSON.
     This is what production (Render) uses: a single-line env var, no
     multiline-JSON escaping problems.
  2. GOOGLE_APPLICATION_CREDENTIALS — path to a service-account JSON file
     (the same var evaluation.py already uses for local dev).
  3. FIREBASE_PROJECT_ID — project id only. Verifying an ID token needs the
     project id (to check the audience) plus Google's *public* signing
     certificates, so this is enough for local development without handing
     a service-account key to every developer.
"""
import base64
import binascii
import json
import os

import firebase_admin
from fastapi import Header, HTTPException
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from google.auth.credentials import AnonymousCredentials


class _VerifyOnlyCredential(credentials.Base):
    """
    A credential that grants nothing.

    Verifying an ID token only requires the project id (to check the token's
    audience) and Google's *public* signing certificates — no privileged
    access. Supplying this explicitly lets local development run without a
    service-account key, while still failing closed on invalid tokens.
    Production supplies a real service account instead.
    """

    def get_credential(self) -> AnonymousCredentials:
        return AnonymousCredentials()


def _init_firebase() -> None:
    """Initialize the Firebase Admin app once, from whichever source is set."""
    if firebase_admin._apps:
        return

    encoded = os.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64")
    if encoded:
        try:
            service_account = json.loads(base64.b64decode(encoded))
        except (binascii.Error, ValueError) as exc:
            raise RuntimeError(
                "FIREBASE_SERVICE_ACCOUNT_BASE64 is not valid base64-encoded JSON"
            ) from exc
        firebase_admin.initialize_app(credentials.Certificate(service_account))
        return

    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if cred_path:
        firebase_admin.initialize_app(credentials.Certificate(cred_path))
        return

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    if project_id:
        firebase_admin.initialize_app(
            _VerifyOnlyCredential(), options={"projectId": project_id}
        )
        return

    raise RuntimeError(
        "No Firebase credentials configured. Set FIREBASE_SERVICE_ACCOUNT_BASE64 "
        "(production), GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_PROJECT_ID "
        "(local development)."
    )


async def require_firebase_user(authorization: str | None = Header(default=None)) -> dict:
    """
    FastAPI dependency: verify the bearer token and return its decoded claims.

    Raises 401 when the header is missing/malformed or the token is invalid,
    expired, or issued for a different Firebase project.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")

    try:
        _init_firebase()
    except RuntimeError as exc:
        # A misconfigured server is a server error, not a client auth failure.
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    try:
        return firebase_auth.verify_id_token(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
