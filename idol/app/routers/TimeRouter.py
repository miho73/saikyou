import logging
from datetime import datetime

import ntplib
from fastapi import APIRouter

log = logging.getLogger(__name__)

router = APIRouter(
  prefix="/time",
  tags=["time"]
)

@router.get(
  path=""
)
async def clock():
  log.info("Begin time fetching")
  date = datetime.now().astimezone()

  client = ntplib.NTPClient()

  kriss_response = client.request("ntp.kriss.re.kr", version=3)
  ntp_time_kriss = kriss_response.tx_time
  log.info("KRISS time fetched", extra={"ntp_time_kriss": ntp_time_kriss})

  dt_kriss = datetime.fromtimestamp(ntp_time_kriss).astimezone()

  return {
    "time": date.isoformat(),
    "kriss": dt_kriss.isoformat(),
  }
