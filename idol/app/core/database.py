from functools import reduce

import redis
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.Config import config

SQLALCHEMY_DATABASE_URL = "postgresql://{user}:{password}@{host}:{port}/{dbname}".format(
  host=config["database"]["relational"]["host"],
  port=config["database"]["relational"]["port"],
  password=config["database"]["relational"]["password"],
  user=config["database"]["relational"]["user"],
  dbname=config["database"]["relational"]["name"]
)

engine = create_engine(
  SQLALCHEMY_DATABASE_URL,
  echo=config["database"]["relational"]["echo"]
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

BaseTable = declarative_base()

redis_client = redis.Redis(
  host=config["database"]["redis"]["host"],
  port=config["database"]["redis"]["port"],
  password=config["database"]["redis"]["password"],
  decode_responses=True,
)


def create_connection():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()


from sqlalchemy.types import TypeDecorator, String


class EnumAsValue(TypeDecorator):
  impl = String

  def __init__(self, enumtype, *args, **kwargs):
    self._enumtype = enumtype
    super().__init__(*args, **kwargs)

  def process_bind_param(self, value, dialect):
    return value.value if value is not None else None

  def process_result_value(self, value, dialect):
    return self._enumtype(value) if value is not None else None


def jsonb_path_equals(column, path_string, target_value):
  path_keys = path_string.split(".")
  path_expression = reduce(lambda obj, key: obj[key], path_keys, column)

  return path_expression.astext == str(target_value)
