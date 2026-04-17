FROM python:3.12.13-slim

LABEL org.opencontainers.image.description="アイドル"

WORKDIR /home/idol

COPY app .
COPY requirements.txt .
RUN mkdir logs
RUN ls -al

RUN pip3 install --no-cache-dir --upgrade -r requirements.txt

ENV mode=prod
ENV commit=${APP_COMMIT}
ENTRYPOINT ["python3", "-m", "uvicorn", "app.main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "8000"]
