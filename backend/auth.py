"""
Authentication: password hashing, JWT session tokens, and the
get_current_user dependency that gates every user-data route.

Deliberately dependency-light:
- Passwords are hashed with PBKDF2-HMAC-SHA256 (Python's stdlib `hashlib`,
  260,000 iterations, the iteration count Django recommends), not a
  compiled bcrypt/argon2 library.
- Sessions are signed JWTs (PyJWT, HS256) carrying only the user id, no
  session table needed.

SECRET_KEY must be set via the JWT_SECRET_KEY env var in any real
deployment; the fallback below is fine for local/demo use only.
"""

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

import db_models
from database import get_db

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-only-insecure-secret-change-me")
ALGORITHM = "HS256"
TOKEN_LIFETIME = timedelta(days=7)
PBKDF2_ITERATIONS = 260_000

_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PBKDF2_ITERATIONS)
    return digest.hex(), salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    candidate, _ = hash_password(password, salt)
    return secrets.compare_digest(candidate, password_hash)


def create_access_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": datetime.now(timezone.utc) + TOKEN_LIFETIME}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session") from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> db_models.User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in required")
    user_id = _decode_token(credentials.credentials)
    user = db.query(db_models.User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in required")
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> db_models.User | None:
    """Same as get_current_user, but for the guest-accessible Predict flow:
    a missing or invalid token means "anonymous visitor", not a 401. Only
    used on routes a guest is explicitly allowed to call (see main.py)."""
    if credentials is None:
        return None
    try:
        user_id = _decode_token(credentials.credentials)
    except HTTPException:
        return None
    return db.query(db_models.User).filter_by(id=user_id).first()


def rate_limit_key(request) -> str:
    """slowapi key_func for routes that are reachable by both signed-in
    users and anonymous visitors (see the guest-accessible /predict).
    Buckets signed-in callers by user id and everyone else by IP, so
    logged-in usage isn't capped by a limit sized for anonymous abuse, and
    a shared office/NAT IP doesn't rate-limit unrelated signed-in users.
    Reads the token directly instead of depending on get_optional_user so
    it can run standalone as a key_func, with no DB session available."""
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        try:
            payload = jwt.decode(auth_header[7:], SECRET_KEY, algorithms=[ALGORITHM])
            return f"user:{payload['sub']}"
        except (jwt.PyJWTError, KeyError):
            pass
    return get_remote_address(request)
