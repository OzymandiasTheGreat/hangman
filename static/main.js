const UI = {
	wordDisplay: document.getElementById('word'),
	progressBar: document.getElementById('progress-bar'),
	hintDisplay: document.getElementById('hint'),
	hintButton:  document.getElementById('hint-button'),
	visual:      document.getElementById('svg-paths'),
	overlay:     document.getElementById('overlay'),
	audioButton: document.getElementById('audio'),
	diffButtons: document.querySelectorAll('input[name=difficulty]'),
	scoreWins:   document.getElementById('wins'),
	scoreLoses:  document.getElementById('loses'),
	pauseButton: document.getElementById('pause'),
};


class Hangman {

	constructor() {
		this.word        = '';
		this.hint        = [];
		this.progress    = 0;
		this.visualStage = 0;
		this.difficulty  = 0;
		this.progressID;
		this.playing;
		this.atempts = new Set();
		this.wins = 0;
		this.loses = 0;

		this.newGame();
		document.addEventListener('keydown', this.onKeyDown.bind(this));
		UI.hintButton.addEventListener('click', this.showHint.bind(this));
		for (let button of UI.diffButtons) {
			button.addEventListener('click', this.newGame.bind(this));
		}
		UI.pauseButton.addEventListener('click', this.pauseGame.bind(this));
	}

	pauseGame() {
		if (this.playing) {
			this.playing = false;
		} else {
			this.playing = true;
		}
	}

	newGame() {
		this.difficulty = Number(
			document.querySelector('input[name=difficulty]:checked').value);
		this.getWord(this.reset.bind(this));
		this.atempts.clear();
		if (this.progressID) {
			clearInterval(this.progressID);
		}
		this.progressID = setInterval(() => {
			if (this.playing) {
				if (this.difficulty < 0) {
					this.addProgress(0);
				} else if (this.difficulty === 0) {
					this.addProgress(2.5);
				} else {
					this.addProgress(5);
				}
			}
		}, 250);
		this.playing = true;
	}

	onKeyDown(e) {
		if (this.isLetter(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey
				&& this.playing) {
			const letter = e.key.toLowerCase();
			let letterExists = false;
			for (let i = 0; i < this.word.length; i++) {
				if (letter === this.word.charAt(i) && !this.atempts.has(letter)) {
					this.playHit();
					letterExists = true;
					UI.wordDisplay.children[i].innerHTML = letter;
					this.progress = 0;
					this.drawProgress();
				}
			}
			if (!letterExists && !this.atempts.has(letter)) {
				this.playMiss();
				this.drawVisual(true);
			}
			this.atempts.add(letter);
			this.checkWinCondition();
		}
	}

	isLetter(letter) {
		if (letter.length === 1 && letter.toUpperCase() !== letter.toLowerCase()) {
			return true;
		}
		return false;
	}

	checkWinCondition() {
		for (let char of UI.wordDisplay.children) {
			if (!char.innerHTML) {
				return false;
			}
		}
		if (this.checkVisual()) {
			return false;
		}
		UI.overlay.innerHTML = 'VICTORY!';
		UI.overlay.style.display = 'block';
		this.updateScore(true);
		this.showHint();
		setTimeout(() => this.newGame(), 3000);
		this.playing = false;
	}

	showHint() {
		UI.hintDisplay.innerHTML = this.hint;
	}

	revealWord() {
		for (let i = 0; i < this.word.length; i++) {
			UI.wordDisplay.children[i].innerHTML = this.word.charAt(i);
		}
	}

	getWord(cb) {
		let query = '';
		if (this.difficulty < 0) {
			query = '?min=3&max=5';
		} else if (this.difficulty > 0) {
			query = '?min=9';
		} else {
			query = '?min=6&max=8';
		}
		const request = new XMLHttpRequest();
		request.onreadystatechange = () => {
			if (request.readyState === XMLHttpRequest.DONE
					&& request.status === 200) {
				const wordJson = JSON.parse(request.responseText);
				this.word = wordJson.word.toLowerCase();
				this.hint = wordJson.hint;
				cb();
			}
		};
		request.open('GET', `/hangman/random${query}`);
		request.send(null);
	}

	reset() {
		this.drawWord();
		this.progress = 0;
		this.drawProgress();
		this.visualStage = 0;
		this.drawVisual(false);
		UI.hintDisplay.innerHTML = '';
		UI.overlay.innerHTML = '';
		UI.overlay.style.display = 'none';
	}

	drawWord() {
		UI.wordDisplay.innerHTML = '';

		for (let i = 0; i < this.word.length; i++) {
			let letter = document.createElement('div');
			letter.classList.add('letter');
			UI.wordDisplay.appendChild(letter);
		}
	}

	drawProgress() {
		UI.progressBar.style.width = `${this.progress}%`;
	}

	drawVisual(increment) {
		if (increment) {
			for (let path of UI.visual.children) {
				if (path.style.visibility !== 'visible') {
					path.style.visibility = 'visible';
					break;
				}
			}
			if (this.checkVisual()) {
				this.gameOver();
			}
		} else {
			for (let path of UI.visual.children) {
				path.style.visibility = 'hidden';
			}
		}
	}

	addProgress(amount) {
		this.progress += amount;
		this.progress = Math.min(this.progress, 100);
		this.drawProgress();
		if (this.progress === 100) {
			this.drawVisual(true);
			this.playMiss();
			this.progress = 0;
			this.drawProgress();
		}
	}

	checkVisual() {
		for (let path of UI.visual.children) {
			if (path.style.visibility !== 'visible') {
				return false;
			}
		}
		return true;
	}

	gameOver() {
		UI.overlay.innerHTML = 'GAME OVER';
		UI.overlay.style.display = 'block';
		this.updateScore(false);
		this.revealWord();
		this.showHint();
		setTimeout(() => this.newGame(), 3000);
		this.playing = false;
	}

	playHit() {
		if (UI.audioButton.checked) {
			const audio = new Audio('hangman/static/assets/decide.mp3');
			audio.play();
		}
	}

	playMiss() {
		if (UI.audioButton.checked) {
			const audio = new Audio('hangman/static/assets/chime.wav');
			audio.play();
		}
	}

	updateScore(won) {
		if (won) {
			this.wins++;
		} else {
			this.loses++;
		}
		UI.scoreWins.innerHTML = this.wins;
		UI.scoreLoses.innerHTML = this.loses;
	}
};


new Hangman();
