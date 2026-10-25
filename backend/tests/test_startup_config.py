"""The JWT secret check runs at import time, so each case starts a fresh
interpreter with its own environment."""

import os
import subprocess
import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parent.parent


def _import_main(env_overrides):
    env = {k: v for k, v in os.environ.items() if k not in {"JWT_SECRET_KEY", "VERCEL"}}
    env.update(env_overrides)
    env["DATABASE_URL"] = "sqlite://"
    return subprocess.run([sys.executable, "-c", "import main"], cwd=BACKEND, env=env, capture_output=True, text=True)


@pytest.mark.parametrize("secret", [None, "", "   "])
def test_refuses_to_start_on_vercel_without_jwt_secret(secret):
    overrides = {"VERCEL": "1"}
    if secret is not None:
        overrides["JWT_SECRET_KEY"] = secret
    result = _import_main(overrides)
    assert result.returncode != 0
    assert "JWT_SECRET_KEY must be set" in result.stderr


def test_starts_on_vercel_with_jwt_secret():
    result = _import_main({"VERCEL": "1", "JWT_SECRET_KEY": "x" * 48})
    assert result.returncode == 0, result.stderr


def test_local_development_still_starts_without_jwt_secret():
    result = _import_main({})
    assert result.returncode == 0, result.stderr
