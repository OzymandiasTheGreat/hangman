#! /usr/bin/env python3

import json
from flask import Flask, request
from pony.flask import Pony
from pony.orm import select
from .skeleton import Word


app = Flask(__name__)
Pony(app)


def random_word(min_len, max_len):

	word = select(word for word in Word if ' ' not in word.word).random(1)[0]
	if min_len <= len(word.word) <= max_len:
		return word
	return random_word(min_len, max_len)


@app.route('/')
def index():

	with open('static/index.html') as fd:
		return fd.read()


@app.route('/random')
def random():

	min_len = request.args.get('min')
	min_len = int(min_len) if min_len else 1
	max_len = request.args.get('max')
	max_len = int(max_len) if max_len else 50
	word = random_word(min_len, max_len)
	return json.dumps(word.to_dict())
