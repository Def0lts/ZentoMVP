import os
from psycopg.rows import dict_row
import psycopg

DATABASE_URL = os.getenv("DATABASE_URL", "")

def get_conn():
    DATABASE_URL = os.getenv("DATABASE_URL")

    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set")

    return psycopg.connect(DATABASE_URL, row_factory=dict_row)