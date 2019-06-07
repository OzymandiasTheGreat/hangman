#! /usr/bin/env python3

import json
from pathlib import Path
from pony.orm import db_session
from .skeleton import Word


DATA_PATH = Path('wordset-dictionary/data')
DATA_IDX  = 'abcdefghijklmnopqrstuvwxyz'


@db_session
def build_db():

	for letter in DATA_IDX:
		json_path = (DATA_PATH / '{}.json'.format(letter)).resolve()
		with json_path.open(mode='r') as fd:
			data = json.loads(fd.read())
		for word, attrs in data.items():
			hint        = []
			speech_part = []
			synonyms    = []
			examples    = []
			if 'meanings' in attrs:
				for meaning in attrs['meanings']:
					if 'def' in meaning:
						hint.append(meaning['def'])
					if 'speech_part' in meaning:
						speech_part.append(meaning['speech_part'])
					if 'synonyms' in meaning:
						synonyms.extend(meaning['synonyms'])
					if 'example' in meaning:
						examples.append(meaning['example'])
				entry = Word.get(word=word)
				if entry:
					entry.hint        += hint
					entry.speech_part += speech_part
					entry.synonyms    += synonyms
					entry.examples    += examples
				else:
					Word(
						word=word, hint=hint, speech_part=speech_part,
						synonyms=synonyms, examples=examples)
