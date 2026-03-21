FROM python:3.14.3-alpine3.23

LABEL org.opencontainers.image.description="アイドル"

WORKDIR /home/idol

COPY ./main.py .
COPY requirements.txt .
RUN mkdir logs

RUN pip3 install --no-cache-dir --upgrade -r requirements.txt

ENV mode=prod
ENV commit=${APP_COMMIT}
ENTRYPOINT ["python3", "-m", "uvicorn", "main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "8000"]
