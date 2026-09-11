import secrets
import threading
import time
from collections import defaultdict, deque

from fastapi import APIRouter, Cookie, HTTPException, Request, Response
from pydantic import BaseModel
from renault_api.exceptions import NotAuthenticatedException

from backend.renault_service import (
    RenaultSession,
    authenticate,
    get_car_picture,
    get_car_status,
    get_charge_history,
)

router = APIRouter()
SESSION_COOKIE = "renault_session"
_sessions: dict[str, RenaultSession] = {}
LOGIN_LIMIT = 5
INVALID_SESSION_LIMIT = 30
RATE_LIMIT_WINDOW_SECONDS = 60
_rate_limits: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_rate_limit_lock = threading.Lock()


class LoginRequest(BaseModel):
    email: str
    password: str


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _check_rate_limit(category: str, client_ip: str, limit: int) -> None:
    now = time.monotonic()
    key = (category, client_ip)

    with _rate_limit_lock:
        attempts = _rate_limits[key]
        cutoff = now - RATE_LIMIT_WINDOW_SECONDS
        while attempts and attempts[0] <= cutoff:
            attempts.popleft()

        if len(attempts) >= limit:
            retry_after = max(1, int(RATE_LIMIT_WINDOW_SECONDS - (now - attempts[0])) + 1)
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Try again later.",
                headers={"Retry-After": str(retry_after)},
            )

        attempts.append(now)


def _is_authenticated(session_id: str | None, request: Request) -> bool:
    if not session_id:
        return False
    if session_id in _sessions:
        return True
    _check_rate_limit("invalid-session", _client_ip(request), INVALID_SESSION_LIMIT)
    return False


def _get_renault_session(session_id: str | None, request: Request) -> RenaultSession:
    if not _is_authenticated(session_id, request):
        raise HTTPException(status_code=401, detail="Authentication required")
    return _sessions[session_id]


@router.post("/auth/login")
async def login(credentials: LoginRequest, request: Request, response: Response):
    """Authenticate with Renault and start a local application session."""
    _check_rate_limit("login", _client_ip(request), LOGIN_LIMIT)
    if not credentials.email.strip() or not credentials.password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    try:
        renault_session = await authenticate(credentials.email.strip(), credentials.password)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    session_id = secrets.token_urlsafe(32)
    _sessions[session_id] = renault_session
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_id,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
    )
    return {"authenticated": True}


@router.get("/auth/session")
async def auth_session(request: Request, renault_session: str | None = Cookie(default=None)):
    """Report whether the browser has an active local session."""
    return {"authenticated": _is_authenticated(renault_session, request)}


@router.post("/auth/logout")
async def logout(response: Response, renault_session: str | None = Cookie(default=None)):
    """End the local application session."""
    if renault_session:
        _sessions.pop(renault_session, None)
    response.delete_cookie(SESSION_COOKIE)
    return {"authenticated": False}

@router.get("/hello")
async def hello():
    """Sample API endpoint."""
    return {"message": "Hello from the backend!"}


@router.get("/car/picture")
async def car_picture(request: Request, renault_session: str | None = Cookie(default=None)):
    """Fetch picture and model info for the logged-in user's Renault vehicle."""
    session_info = _get_renault_session(renault_session, request)
    try:
        return await get_car_picture(session_info)
    except NotAuthenticatedException as exc:
        if renault_session:
            _sessions.pop(renault_session, None)
        raise HTTPException(status_code=401, detail="Authentication expired") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/car/status")
async def car_status(request: Request, renault_session: str | None = Cookie(default=None)):
    """Fetch current status of the logged-in user's Renault vehicle."""
    session_info = _get_renault_session(renault_session, request)
    try:
        status = await get_car_status(session_info)
        return status
    except NotAuthenticatedException as exc:
        if renault_session:
            _sessions.pop(renault_session, None)
        raise HTTPException(status_code=401, detail="Authentication expired") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/car/charges")
async def car_charges(
    request: Request,
    days: int = 90,
    renault_session: str | None = Cookie(default=None),
):
    """Fetch charge session history (kWh, duration, avg charging speed) for the logged-in user's vehicle."""
    session_info = _get_renault_session(renault_session, request)
    try:
        return {"sessions": await get_charge_history(session_info, days=days)}
    except NotAuthenticatedException as exc:
        if renault_session:
            _sessions.pop(renault_session, None)
        raise HTTPException(status_code=401, detail="Authentication expired") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
