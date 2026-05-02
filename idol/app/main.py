import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.Config import mode, config
from app.core.logger import setup_logging
from app.middleware.RequestIDMiddleware import RequestIDMiddleware
from app.middleware.RequestLoggingMiddleware import RequestLoggingMiddleware
from app.routers import TimeRouter, CaptchaRouter

setup_logging()
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
  log.info("Environment: %s | Commit#: %s", mode, os.environ.get("commit"))
  log.info("Application started on %s", datetime.now().isoformat())
  yield
  log.info("Application ended on %s", datetime.now().isoformat())


app = FastAPI(lifespan=lifespan)

origins = [
  "chrome-extension://" + config["idol"]["extension_id"],
]

app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RequestIDMiddleware)

app.include_router(TimeRouter.router)
app.include_router(CaptchaRouter.router)
