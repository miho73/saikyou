from datetime import datetime

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
  date = datetime.now()

  return {
    "time": date.isoformat(),

  }
