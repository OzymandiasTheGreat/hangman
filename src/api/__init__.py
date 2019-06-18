#! /usr/bin/env python3

import os
import json
from pathlib import Path
from urllib.parse import urlparse
from ast import literal_eval
from flask import Flask, request, Response
from pony.flask import Pony
from pony.orm import select
from googletrans import Translator, LANGUAGES


app = Flask(__name__)
Pony(app)
translator = Translator()
VALID_ORIGIN = literal_eval(os.environ['VALID_ORIGIN'])


if app.config['ENV'] == 'development':
	from dotenv import load_dotenv
	load_dotenv(str(Path('../.env').resolve()))
	VALID_ORIGIN.add('localhost')
	VALID_ORIGIN.add('localhost:3000')
	VALID_ORIGIN.add('192.168.1.102')



import os                    # noqa
from .skeleton import Word   # noqa


def check_origin(referrer):

	domain = urlparse(referrer)
	if domain.netloc in VALID_ORIGIN:
		return True
	return False


def random_word(min_len, max_len, lang):

	entity = select(word for word in Word if ' ' not in word.word).random(1)[0]
	word = entity.to_dict()
	if lang != 'en':
		translation = translator.translate(
			[word['word'], *word['hint']], src='en', dest=lang)
		if min_len <= len(translation[0].text) <= max_len:
			word['word'] = translation.pop(0).text
			word['hint'] = [t.text for t in translation]
			return word
	else:
		if min_len <= len(word['word']) <= max_len:
			return word
	return random_word(min_len, max_len, lang)


@app.route('/api/random')
def random():

	if check_origin(request.referrer):
		min_len = request.args.get('min')
		min_len = int(min_len) if min_len else 1
		max_len = request.args.get('max')
		max_len = int(max_len) if max_len else 50
		lang = request.args.get('lang') or 'en'
		word = random_word(min_len, max_len, lang)
		return Response(json.dumps(word), mimetype='application/json')
	return Response('Not authorized!', status=401)


@app.route('/api/languages')
def languages():

	if check_origin(request.referrer):
		return Response(json.dumps(LANGUAGES), mimetype='application/json')
	return Response('Not authorized!', status=401)
