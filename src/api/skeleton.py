#! /usr/bin/env python3

import os
from pony.orm import Database, Required, Optional, Json


db = Database()
db.bind(
	provider='postgres', user=os.environ['POSTGRES_USER'], password=os.environ['POSTGRES_PASS'],
	host=os.environ['POSTGRES_HOST'], database=os.environ['POSTGRES_DB'])


class Word(db.Entity):

	word        = Required(str, unique=True)
	hint        = Required(Json, default=[])
	speech_part = Optional(Json, default=[])
	synonyms    = Optional(Json, default=[])
	examples    = Optional(Json, default=[])


db.generate_mapping(create_tables=True)
