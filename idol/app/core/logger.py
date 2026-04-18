import logging
import os
import sys

from contextvars import ContextVar
from datetime import datetime
from logging import Filter
from logging.handlers import TimedRotatingFileHandler

from pythonjsonlogger.json import JsonFormatter

from app.core.Config import config

class CJsonFormatter(JsonFormatter):
  def add_fields(self, log_record, record, message_dict):
    super(CJsonFormatter, self).add_fields(log_record, record, message_dict)

    if not log_record.get('timestamp'):
      now = datetime.now().isoformat()
      log_record['timestamp'] = now

    if log_record.get('level'):
      log_record['level'] = log_record['level'].upper()
    else:
      log_record['level'] = record.levelname

    log_record['request_id'] = get_request_id()

class RequestIdFilter(Filter):
  def filter(self, record):
    record.request_id = get_request_id()
    return True

request_id_context: ContextVar[str] = ContextVar("request_id", default="")

def get_request_id() -> str:
  return request_id_context.get()

def setup_logging():
  log_level_str = config["log"]["level"]
  if log_level_str == "DEBUG":
    log_level = logging.DEBUG
  elif log_level_str == "INFO":
    log_level = logging.INFO
  elif log_level_str == "WARNING":
    log_level = logging.WARNING
  elif log_level_str == "ERROR":
    log_level = logging.ERROR
  else:
    log_level = logging.INFO

  log_file_path = config["log"]["path"]
  config_handler = config["log"]["handler"]

  handler = []

  if "terminal" in config_handler:
    t_handler = logging.StreamHandler(stream=sys.stdout)
    t_handler.setFormatter(
      logging.Formatter(config["log"]["format"])
    )
    t_handler.setLevel(log_level)
    t_handler.addFilter(RequestIdFilter())

    handler.append(t_handler)
  if "file" in config_handler:
    os.makedirs(os.path.dirname(log_file_path), exist_ok=True)
    f_handler = TimedRotatingFileHandler(
        log_file_path,
        when="midnight",
        backupCount=10,
      )
    f_handler.setFormatter(
      CJsonFormatter("%(timestamp)s %(level)s %(name)s %(message)s %(request_id)s %(filename)s %(lineno)d")
    )
    f_handler.setLevel(log_level)
    f_handler.addFilter(RequestIdFilter())

    handler.append(f_handler)

  logging.basicConfig(
    level=log_level,
    handlers=handler,
  )

  access_logger = logging.getLogger("uvicorn.access")
  access_logger.handlers = []

  uvicorn_logger = logging.getLogger("uvicorn")
  uvicorn_logger.handlers = handler
  uvicorn_logger.setLevel(log_level)

  uvicorn_error = logging.getLogger("uvicorn.error")
  uvicorn_error.handlers = handler
  uvicorn_error.setLevel(log_level)

  engine_logger = logging.getLogger("sqlalchemy.engine")
  engine_logger.handlers = handler
  engine_logger.setLevel(logging.WARNING)

  logger = logging.getLogger(__name__)
  logger.debug("Logging has been initialized")
