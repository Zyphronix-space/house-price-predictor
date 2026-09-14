"""Sign-up / sign-in / account routes.

Forgot/reset password runs in "demo mode": no email service is configured
for this project, so instead of emailing the reset link, /auth/forgot-password
returns the token directly in the response (only when the account exists,
and clearly flagged demo_mode=true). It's still a real, single-use, expiring
token validated server-side -- just delivered differently than a production
deployment (which would drop reset_token from the response and email it).
"""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import db_models
from auth import create_access_token, get_current_user, hash_password, verify_password
from auth_models import (
    ChangePasswordIn,
    ForgotPasswordIn,
    ForgotPasswordOut,
    LoginIn,
    ProfileUpdateIn,
    ResetPasswordIn,
    SignupIn,
    TokenOut,
    UserOut,
)
from database import get_db
from rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["auth"])

# These are the classic brute-force/credential-stuffing/signup-spam
# targets, and unlike /predict they're not behind a login -- nobody has a
# token yet, so rate_limit_key's per-user bucketing falls through to its
# per-IP fallback for every caller here, which is exactly what's wanted.

RESET_TOKEN_LIFETIME = timedelta(minutes=30)


@router.post("/signup", response_model=TokenOut)
@limiter.limit("10/hour")
def signup(request: Request, payload: SignupIn, db: Session = Depends(get_db)):
    existing = db.query(db_models.User).filter_by(email=payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    password_hash, salt = hash_password(payload.password)
    user = db_models.User(
        email=payload.email.lower(),
        display_name=(payload.display_name or "").strip() or None,
        password_hash=password_hash,
        password_salt=salt,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(db_models.User).filter_by(email=payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash, user.password_salt):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if user.deleted_at is not None:
        # Same message as a wrong password -- a deactivated account isn't
        # distinguishable from "doesn't exist" to whoever's trying to log
        # into it, same reasoning as forgot-password's account enumeration
        # guard above.
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: db_models.User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: ProfileUpdateIn,
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.display_name is not None:
        user.display_name = payload.display_name.strip() or None
    db.commit()
    db.refresh(user)
    return user


@router.delete("/me", status_code=204)
def delete_account(
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Cascades to the user's houses and predictions -- see the
    # relationship(cascade="all, delete-orphan") settings on db_models.User.
    db.delete(user)
    db.commit()


@router.post("/change-password", status_code=204)
@limiter.limit("10/hour")
def change_password(
    request: Request,
    payload: ChangePasswordIn,
    user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, user.password_hash, user.password_salt):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    password_hash, salt = hash_password(payload.new_password)
    user.password_hash = password_hash
    user.password_salt = salt
    db.commit()


@router.post("/forgot-password", response_model=ForgotPasswordOut)
@limiter.limit("5/hour")
def forgot_password(request: Request, payload: ForgotPasswordIn, db: Session = Depends(get_db)):
    generic_message = "If an account exists for that email, a reset link has been generated."
    user = db.query(db_models.User).filter_by(email=payload.email.lower()).first()
    if not user:
        # Same response shape whether or not the account exists, so this
        # endpoint can't be used to enumerate registered emails.
        return ForgotPasswordOut(demo_mode=True, message=generic_message)

    token = secrets.token_urlsafe(32)
    reset_row = db_models.PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.now(timezone.utc) + RESET_TOKEN_LIFETIME,
    )
    db.add(reset_row)
    db.commit()

    return ForgotPasswordOut(
        demo_mode=True,
        message="No email service is configured for this project -- here is your reset link (demo mode).",
        reset_token=token,
    )


@router.post("/reset-password", status_code=204)
@limiter.limit("10/hour")
def reset_password(request: Request, payload: ResetPasswordIn, db: Session = Depends(get_db)):
    row = db.query(db_models.PasswordResetToken).filter_by(token=payload.token).first()
    now = datetime.now(timezone.utc)
    if not row or row.used_at is not None or row.expires_at.replace(tzinfo=timezone.utc) < now:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")

    user = db.query(db_models.User).filter_by(id=row.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")

    password_hash, salt = hash_password(payload.new_password)
    user.password_hash = password_hash
    user.password_salt = salt
    row.used_at = now
    db.commit()
