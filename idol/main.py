from datetime import datetime
import ntplib

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
  date = datetime.now().astimezone()

  client = ntplib.NTPClient()

  google_response = client.request("time.google.com", version=3)
  ntp_time_google = google_response.tx_time

  kriss_response = client.request("ntp.kriss.re.kr", version=3)
  ntp_time_kriss = kriss_response.tx_time

  nist_response = client.request("time.nist.gov", version=3)
  ntp_time_nist = nist_response.tx_time

  dt_google = datetime.fromtimestamp(ntp_time_google).astimezone()
  dt_kriss = datetime.fromtimestamp(ntp_time_kriss).astimezone()
  dt_nist = datetime.fromtimestamp(ntp_time_nist).astimezone()

  return {
    "time": date.isoformat(),
    "google": dt_google.isoformat(),
    "kriss": dt_kriss.isoformat(),
    "nist": dt_nist.isoformat(),
  }
