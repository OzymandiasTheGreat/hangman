#! /usr/bin/env python3

import sys
from pathlib import Path
from dotenv import load_dotenv, find_dotenv


load_dotenv(find_dotenv())
sys.path.insert(0, str(Path(__file__).parent.parent.resolve()))
from api.skeleton import Word, db
from api.db import build_db


Word.drop_table(with_all_data=True)
db.create_tables()
build_db()
