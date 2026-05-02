import logging
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logger import request_id_context

log = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
  async def dispatch(self, request: Request, call_next):
    rid = request.headers.get("X-Request-ID", str(uuid.uuid4()))

    token = request_id_context.set(rid)

    try:
      response = await call_next(request)
      response.headers["X-Request-ID"] = rid
      return response
    finally:
      request_id_context.reset(token)
