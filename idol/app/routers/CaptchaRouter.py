import logging
import time
import uuid

import numpy as np
from fastapi import APIRouter, BackgroundTasks, Request
from fastapi.exceptions import HTTPException
from starlette.responses import JSONResponse

from app.core import CoreCaptchaSolve
from app.core.Config import config
from app.core.database import SessionLocal, redis_client
from app.core.logger import get_request_id
from app.models.AllowedCaptcha import AllowedCaptcha
from app.models.CaptchaRecordModel import CaptchaRecordModel
from app.schemas.CaptchaSolveRequest import CaptchaSolveRequest, CaptchaSolution

log = logging.getLogger(__name__)

router = APIRouter(
  prefix="/captcha",
  tags=["captcha"]
)

PRINCIPLE_CACHE_TTL = config["database"]["redis"]["principle_cache"]["ttl"]
PRINCIPLE_CACHE_PREFIX = config["database"]["redis"]["principle_cache"]["prefix"]


def _commit_record(record: CaptchaRecordModel):
  with SessionLocal() as db:
    try:
      db.add(record)
      db.commit()
    except Exception as e:
      log.error("Failed to commit captcha record", exc_info=e)
      db.rollback()


def _verify_principle(http_request: Request):
  raw = http_request.headers.get("X-Principle")
  if not raw:
    log.warning("No X-Principle header in request")
    raise HTTPException(status_code=403, detail="Missing X-Principle header")

  try:
    principle_uid = uuid.UUID(raw)
  except ValueError:
    log.warning("Invalid X-Principle header format", extra={"header": raw})
    raise HTTPException(status_code=403, detail="Invalid X-Principle header")

  cache_key = PRINCIPLE_CACHE_PREFIX + str(principle_uid)
  cached = redis_client.get(cache_key)

  if cached == "1":
    log.info("Principle allowed (hit)", extra={"principle": str(principle_uid), "cache": "hit"})
    return

  with SessionLocal() as db:
    record = db.get(AllowedCaptcha, principle_uid)

  allowed = record is not None and record.allowed

  if not allowed:
    log.info("Principle not allowed (miss)", extra={"principle": str(principle_uid), "cache": "miss"})
    raise HTTPException(status_code=403, detail="Principle not allowed")

  redis_client.set(cache_key, "1", ex=PRINCIPLE_CACHE_TTL)
  log.info("Principle allowed (miss)", extra={"principle": str(principle_uid), "cache": "miss"})


@router.post("/solve")
async def solve(
  http_request: Request,
  request: CaptchaSolveRequest,
  background_tasks: BackgroundTasks,
):
  _verify_principle(http_request)

  pixel_array = np.array(request.image, dtype=np.uint8).reshape((26, 52, 3))

  log.info("Begin CAPTCHA solve")
  t0 = time.perf_counter()

  digits = CoreCaptchaSolve.process_image(pixel_array)
  log.info("Preprocessing completed", extra={"latency": (time.perf_counter() - t0) * 1000})

  t1 = time.perf_counter()
  prediction = CoreCaptchaSolve.predict(digits)

  pred_num = np.argmax(prediction, axis=1)
  pred_conf = np.max(prediction, axis=1)

  sol = CaptchaSolution(
    solution=f"{pred_num[0]}{pred_num[1]}",
    confidence=pred_conf[0] * pred_conf[1]
  )

  log.info(
    "Prediction completed",
    extra={
      "answer": sol.solution,
      "confidence": sol.confidence,
      "latency": (time.perf_counter() - t1) * 1000
    }
  )

  digits = digits.reshape((-1, 28, 28))
  record = CaptchaRecordModel(
    request_id=uuid.UUID(get_request_id()),
    original_image=request.image,
    digit_image=digits.tolist(),
    predicted=pred_num.tolist(),
    all_scores=prediction.tolist(),
    turnaround_time=(time.perf_counter() - t0) * 1000,
    model_tag=config["model"]["tag"],
  )
  background_tasks.add_task(_commit_record, record)

  return JSONResponse(
    status_code=200,
    content=sol.model_dump()
  )
