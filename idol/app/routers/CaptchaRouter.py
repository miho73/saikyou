import logging
import time
import uuid

import numpy as np
from fastapi import APIRouter
from fastapi.params import Depends
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse

from app.core import CoreCaptchaSolve
from app.core.Config import config
from app.core.database import create_connection
from app.core.logger import get_request_id
from app.models.CaptchaRecordModel import CaptchaRecordModel
from app.schemas.CaptchaSolveRequest import CaptchaSolveRequest, CaptchaSolution

log = logging.getLogger(__name__)

router = APIRouter(
  prefix="/captcha",
  tags=["captcha"]
)

@router.post("/solve")
async def solve(
  request: CaptchaSolveRequest,
  db: Session = Depends(create_connection)
):
  pixel_array = np.array(request.image, dtype=np.uint8).reshape((26,52,3))

  log.info("Begin CAPTCHA solve")
  t0 = time.perf_counter()
  try:
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

    record = CaptchaRecordModel(
      request_id=uuid.UUID(get_request_id()),
      original_image=request.image,
      digit_image=digits.tolist(),
      predicted=pred_num.tolist(),
      all_scores=prediction.tolist(),
      turnaround_time=(time.perf_counter() - t0) * 1000,
      model_tag=config["model"]["tag"],
    )
    db.add(record)
    db.commit()

    return JSONResponse(
      status_code=200,
      content=sol.model_dump()
    )
  except Exception as e:
    log.error(f"Prediction cannot be made", e)

    return JSONResponse(
      status_code=400,
      content=""
    )
