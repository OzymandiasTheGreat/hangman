import $ from 'jquery';
import M from 'materialize-css';
import CSS from './main.sass';    // eslint-disable-line no-unused-vars


const API = {
	languages: './api/languages',
	random: './api/random'
};
const AUDIO = {
	correct: './assets/decide.mp3',
	wrong: './assets/chime.mp3',
};
const UI = {};
const lsAccepted = 'accepted';
const lsDifficulty = 'difficulty';
const lsLanguage = 'language';
const lsSound = 'sound';


class Game {

	constructor() {
		this.paused = true;

		this.word = null;
		this.hint = null;
		this.attempts = new Set();
		this.progress = 0;

		this.preset = {
			easy: {
				minLength: 3,
				maxLength: 5,
				maxAttempts: 12,
				progressSpeed: 0,
			},
			normal: {
				minLength: 6,
				maxLength: 9,
				maxAttempts: 12,
				progressSpeed: 3,
			},
			hard: {
				minLength: 10,
				maxLength: 14,
				maxAttempts: 10,
				progressSpeed: 8,
			},
		};

		this.loading = UI.word.html();
		this.progressTimer = null;
		this.hintTimer = null;
		this.attemptsLeft = this.preset[difficulty].maxAttempts;

		UI.input.on('input', (event) => {
			let char = event.originalEvent.data;
			UI.input.val('');
			if (Game.isLetter(char) && !this.paused) {
				let letter = char.toUpperCase();
				if (!this.attempts.has(letter)) {
					let indices = [];
					for (let i = this.word.indexOf(letter); i >= 0; i = this.word.indexOf(letter, ++i)) {
						indices.push(i);
					}
					if (indices.length) {
						this.guessedRight(indices, letter);
					} else {
						this.guessedWrong(letter);
					}
					this.attempts.add(letter);
				}
			}
		});
	}

	start() {
		$.get(`${API.random}?lang=${lang}&min=${this.preset[difficulty].minLength}&max=${this.preset[difficulty].maxLength}`)
			.done((response) => {
				this.word = response.word.toUpperCase();
				UI.word.html('');
				[...this.word].forEach(function () {
					UI.word.append(`<div class="${UI.className.letter}">_</div>`);
				});
				this.hint = response.hint;
				this.paused = false;
				if (this.progressTimer === null) {
					this.progressTimer = setInterval(() => {
						if (!this.paused) {
							if (this.progress >= 100) {
								this.progress = 0;
								Game.chime(AUDIO.wrong);
								this.attemptsLeft--;
								UI.progress.css('width', '0%');
								this.checkLoseCondition();
							} else {
								this.progress += this.preset[difficulty].progressSpeed;
								UI.progress.css('width', `${this.progress}%`);
							}
						}
					}, 1000);
				}
			});
	}

	pause(message, loading=true) {
		this.paused = true;
		UI.message.text(message);
		UI.material.overlay.open();
		if (loading) UI.word.html(this.loading);
		this.attempts.clear();
		this.attemptsLeft = this.preset[difficulty].maxAttempts;
		clearInterval(this.progressTimer);
		this.progressTimer = null;
		UI.progress.css('width', 0);
		UI.hint.css('opacity', 0);
		UI.attempt.html('');
	}

	showHint() {
		let hint = this.hint[Math.floor(Math.random() * this.hint.length)];
		UI.hint.text(hint.slice(0, 1).toUpperCase() + hint.slice(1));
		UI.hint.css('opacity', 1);
		Game.chime(AUDIO.wrong);
		this.attemptsLeft--;
		if (this.hintTimer !== null) {
			clearTimeout(this.hintTimer);
		}
		this.hintTimer = setTimeout(() => {
			UI.hint.css('opacity', 0);
		}, 7500);
	}

	static isLetter(char) {
		if (char.length === 1 && char.toUpperCase() !== char.toLowerCase()) {
			return true;
		}
		return false;
	}

	static chime(path) {
		if (UI.sound.is(':checked')) {
			const audio = new Audio(path);
			audio.play();
		}
	}

	guessedRight(indices, letter) {
		for (let index of indices) {
			$(UI.word.children(`.${UI.className.letter}`)[index]).text(letter);
		}
		Game.chime(AUDIO.correct);
		this.checkWinCondition();
	}

	guessedWrong(letter) {
		Game.chime(AUDIO.wrong);
		UI.attempt.append(`<div class="attempt">${letter}</div>`);
		this.attemptsLeft--;
		this.checkLoseCondition();
	}

	checkWinCondition() {
		if (!UI.word.text().includes('_')) {
			this.pause('You Win!', false);
			setTimeout(() => {
				UI.material.overlay.close();
			}, 750);
		}
	}

	checkLoseCondition() {
		if (UI.attempt.children().length >= this.attemptsLeft) {
			for (let i = 0; i < this.word.length; i++) {
				$(UI.word.children(`.${UI.className.letter}`)[i]).text(this.word[i]);
			}
			this.pause('You Lose!', false);
			setTimeout(() => {
				UI.material.overlay.close();
			}, 750);
		}
	}
}


let lang = window.localStorage.getItem(lsLanguage) || 'en';
let difficulty = window.localStorage.getItem(lsDifficulty) || 'normal';
let sound = (window.localStorage.getItem(lsSound) === String(true));
let game = null;


$(function () {
	UI.menu = $('#menu');
	UI.main = $('main');
	UI.difficulty = $('input[name="difficulty"]');
	UI.showHint = $('#show-hint');
	UI.pause = $('#pause');
	UI.sound = $('#sound');
	UI.language = $('#language');
	UI.input = $('#input');
	UI.word = $('#word');
	UI.hint = $('#hint');
	UI.progress = $('#progress');
	UI.attempt = $('#attempt');
	UI.message = $('#message');
	UI.cookiesOK = $('#cookies-ok');
	UI.className = {
		letter: 'letter',
		attempt: 'attempt',
	};
	UI.components = {
		cookieWarning: $('#cookie-warning'),
		menu: $('#menu'),
		overlay: $('#overlay'),
	};
	UI.material = {};
	game = new Game();

	UI.material.cookieWarning = M.Modal.init(UI.components.cookieWarning, {
		opacity: 0.7,
		dismissible: false,
	})[0];
	if (window.localStorage.getItem(lsAccepted) !== String(true)) {
		UI.material.cookieWarning.open();
		UI.components.cookieWarning.next('.modal-overlay').css('z-index', 2001);
		UI.cookiesOK.click(function () {
			window.localStorage.setItem(lsAccepted, String(true));
			UI.material.cookieWarning.destroy();
		});
	}

	UI.material.overlay = M.Modal.init(UI.components.overlay, {
		opacity: 0.7,
		onOpenStart: () => {
			UI.word.css('animation', 'shrink 1s forwards');
		},
		onCloseEnd: () => {
			game.start();
			UI.word.css('animation', 'grow 0.7s');
			UI.input.focus();
		},
	})[0];
	UI.components.overlay.click(() => UI.components.overlay.next('.modal-overlay').click());
	game.pause('Start Game');

	$.get(API.languages).done(function (response) {
		UI.material.sidenav = M.Sidenav.init(UI.components.menu, {
			onCloseEnd: () => UI.input.focus(),
		})[0];

		UI.difficulty.filter(`#${difficulty}`).prop('checked', true);
		UI.difficulty.change(function () {
			let value = UI.difficulty.filter(':checked').val();
			difficulty = value;
			window.localStorage.setItem(lsDifficulty, value);
			game.pause('');
			UI.material.overlay.close();
		});

		UI.showHint.click(() => game.showHint());

		UI.pause.click(function () {
			game.pause('PAUSED');
		});

		UI.sound.prop('checked', sound);
		UI.sound.change(function () {
			let value = UI.sound.is(':checked');
			sound = value;
			window.localStorage.setItem(lsSound, String(value));
		});

		for (let [code, name] of Object.entries(response)) {
			UI.language.append(`<option value="${code}">${name}</option>`);
		}
		UI.language.val(lang).change();
		UI.language.change( function (event) {
			lang = event.target.value;
			window.localStorage.setItem(lsLanguage, event.target.value);
			game.pause('');
			UI.material.overlay.close();
		});
		UI.material.language = M.FormSelect.init(UI.language, {})[0];
	});

	UI.main.click(() => UI.input.focus());
	$(document).on('keydown', () => {
		if (!UI.input.is(':focus') && window.localStorage.getItem(lsAccepted) === String(true)) {
			UI.material.overlay.close();
			UI.input.focus();
		}
	});
});
