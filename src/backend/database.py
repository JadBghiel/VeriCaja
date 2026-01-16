import os
from sqlmodel import SQLModel, create_engine, Session

# use SQLite for local development, postgreSQL for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vericaja.db")

# for SQLite, add connect_args configuration
engine = create_engine(
    DATABASE_URL, 
    echo=True,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
