from datetime import datetime
from uuid import UUID as PyUUID

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID, BOOLEAN, TIMESTAMP
from sqlalchemy.orm import Mapped
from sqlalchemy.sql.functions import current_timestamp

from app.core.database import BaseTable


class AllowedCaptcha(BaseTable):
  __tablename__ = 'allowed_captcha'
  principle: Mapped[PyUUID] = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False)
  allowed: Mapped[bool] = Column(BOOLEAN, nullable=False, default=False)

  created_at: Mapped[datetime] = Column(TIMESTAMP(timezone=True), nullable=False, server_default="now()")
  updated_at: Mapped[datetime] = Column(TIMESTAMP(timezone=True), nullable=False, server_default="now()",
                                        onupdate=current_timestamp())
