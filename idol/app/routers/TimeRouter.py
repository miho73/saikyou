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

  google_response = client.request("time.google.com", version=3)
  ntp_time_google = google_response.tx_time
  log.info("Google time fetched", extra={"ntp_time_google": ntp_time_google})

  kriss_response = client.request("ntp.kriss.re.kr", version=3)
  ntp_time_kriss = kriss_response.tx_time
  log.info("KRISS time fetched", extra={"ntp_time_kriss": ntp_time_kriss})

  nist_response = client.request("time.nist.gov", version=3)
  ntp_time_nist = nist_response.tx_time
  log.info("NIST time fetched", extra={"ntp_time_nist": ntp_time_nist})

  raise Exception("dd")

  dt_google = datetime.fromtimestamp(ntp_time_google).astimezone()
  dt_kriss = datetime.fromtimestamp(ntp_time_kriss).astimezone()
  dt_nist = datetime.fromtimestamp(ntp_time_nist).astimezone()

  return {
    "time": date.isoformat(),
    "google": dt_google.isoformat(),
    "kriss": dt_kriss.isoformat(),
    "nist": dt_nist.isoformat(),
  }
