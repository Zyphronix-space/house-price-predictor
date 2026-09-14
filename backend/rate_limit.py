"""Shared slowapi Limiter. Route files (routes_auth.py, routes_admin.py,
...) import `limiter` from here -- not from main.py -- so they can apply
@limiter.limit(...) without importing the app entrypoint module (which
would be a circular import, since main.py itself imports those routers).
"""

from slowapi import Limiter

from auth import rate_limit_key

limiter = Limiter(key_func=rate_limit_key)
