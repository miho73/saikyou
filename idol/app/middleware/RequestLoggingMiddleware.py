import logging
import time

from fastapi.requests import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

log = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
  async def dispatch(self, request: Request, call_next):
    start_time = time.perf_counter()

    method = request.method.upper()
    url = request.url.path

    client_ip = (
      request.headers.get("CF-Connecting-IP")
      or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
      or request.headers.get("X-Real-IP")
      or (request.client.host if request.client else "unknown")
    )
    user_agent = request.headers.get("User-Agent", "")
    principle = request.headers.get("X-Principle", "")

    log.info(
      f"Access: {method} {url}",
      extra={
        "http_method": method,
        "http_url": url,
        "client_ip": client_ip,
        "user_agent": user_agent,
        "user_principle": principle
      }
    )

    try:
      response = await call_next(request)

      process_time = (time.perf_counter() - start_time) * 1000

      log.info(
        f"Completed: {method} {url} - {response.status_code}",
        extra={
          "http_method": method,
          "http_url": url,
          "status_code": response.status_code,
          "latency": process_time
        }
      )
      return response
    except Exception as e:
      process_time = (time.perf_counter() - start_time) * 1000
      log.error(
        f"Failed: {method} {url} - Error: {str(e)}",
        extra={
          "http_method": method,
          "http_url": url,
          "latency": process_time
        },
        exc_info=e
      )

      return Response(
        status_code=400,
      )
