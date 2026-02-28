from app.core.config import settings
from sqlalchemy import create_engine
import traceback

print("URI:", ascii(settings.SQLALCHEMY_DATABASE_URI))

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
try:
    with engine.connect() as conn:
        print("Connected!")
except Exception as e:
    print("Error connecting:")
    traceback.print_exc()
