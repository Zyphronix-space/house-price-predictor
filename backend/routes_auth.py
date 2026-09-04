"""Sign-up / sign-in routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import db_models
from auth import create_access_token, get_current_user, hash_password, verify_password
from auth_models import LoginIn, SignupIn, TokenOut, UserOut
from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenOut)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    existing = db.query(db_models.User).filter_by(email=payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    password_hash, salt = hash_password(payload.password)
    user = db_models.User(
        email=payload.email.lower(),
        password_hash=password_hash,
        password_salt=salt,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(db_models.User).filter_by(email=payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash, user.password_salt):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: db_models.User = Depends(get_current_user)):
    return user
