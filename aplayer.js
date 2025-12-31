//TODO integrate with history and TTS fallback

/*
example:

AudioManager.processAudioData({a: "1.mp3", aVol: 0.5})
AudioManager.processAudioData({a: "1.mp3", aVol: 0.5,aFade: 2});
AudioManager.processAudioData({a: ""})


<br a="1.mp3" data-aFade="2" />
<hr data-aFade="-4" />

a == "*"  select all aplayers
a == ""		select all and stop all, stop fade
aa == ""	stop selected, stop fade
aa == "r"	restart selected, stop fade

a = "path"	select existing or create new play
a = "path 1" number is to make key unique to create or select same path more then once.
so it do aplayers.push(a)
a == "*" select all aplayers


aFade = "-3.1" selected.	negative = fade out to 0 in 3.1 seconds. Positive = fade in to 

undefined, null, wrong = skip parameter

*/

const AudioManager = {
	aVol_mul: 1,          // Global volume multiplier affect all aplayers
	aVol: 1,              // volume for new aplayers. do not change existing aplayers.
	aplayers: {},         // Stores all audio aplayers by their key (m value)
	aPlayer_current: null,// selected player or all aplayers "*"
	aplayers_MAX: 5,      // reuse unused, but may be any number of active aplayers

	processAudioData(layerData) {
		if(!layerData) return;
		const a = layerData.a;
		// Get or create player
		if (a == "*" || a == "") {
			this.aPlayer_current = "*";
		} else if (a) {
			let player = this.aplayers[a];
			if (!player) {
				const path = a.split(' ')[0];
				if (path) {
					const playerCount = Object.keys(this.aplayers).length;
					if (playerCount >= this.aplayers_MAX) {
						const inactiveKey = this.findInactivePlayer();
						if (inactiveKey) {
							player = this.aplayers[inactiveKey];
							delete this.aplayers[inactiveKey];

							// Reset and prepare for reuse
							player.pause();
							player.src = path;
							this.aplayers[a] = player;
						} else {
							// All aplayers are active, create new one anyway
							player = new Audio(path);
							this.aplayers[a] = player;
						}
					} else {
						// We have room for a new player
						player = new Audio(path);
						this.aplayers[a] = player;
					}
					this.aPlayer_current = player;
				}
			}
		}

		if (this.aPlayer_current == "*") {
			for (const key in this.aplayers) {
				this.adjustPlayer(this.aplayers[key], layerData);
			}
		} else if (this.aPlayer_current) {
			this.adjustPlayer(this.aPlayer_current, layerData);
		}
	},

	findInactivePlayer() {
		for (const key in this.aplayers) {
			const player = this.aplayers[key];
			if (player.paused || player.volume === 0) {
				return key;
			}
		}
		return null;
	},

	adjustPlayer(player, layerData) {
		if(!layerData) return;
		// Volume
		let volValue;
		const v = layerData.aVol;
		if (v !== undefined && v !== null) {
			volValue = v === "" ? 1 : parseFloat(v);
			if (isNaN(volValue)) volValue = 1;
		} else {
			volValue = this.aVol;
		}
		player.volume = volValue * this.aVol_mul;

		// Fade
		let fadeTime;
		if (layerData.aFade !== undefined) {
			fadeTime = parseFloat(layerData.aFade);
		}

		if (!isNaN(fadeTime)) {
			if (player.fadeHandle) {
				cancelAnimationFrame(player.fadeHandle);
				player.fadeHandle = null;
			}
			if (fadeTime > 0) {
				// Fade in
				player.volume = 0;
				const startTime = Date.now();
				const duration = fadeTime * 1000;

				const fadeIn = () => {
					const elapsed = Date.now() - startTime;
					const progress = Math.min(elapsed / duration, 1);
					player.volume = progress * volValue * this.aVol_mul;

					if (progress < 1) {
						player.fadeHandle = requestAnimationFrame(fadeIn);
					} else {
						player.volume = volValue * this.aVol_mul;
						player.fadeHandle = null;
					}
				};

				player.fadeHandle = requestAnimationFrame(fadeIn);
			} else if (fadeTime < 0) {
				// Fade out
				const duration = Math.abs(fadeTime) * 1000;
				const startVolume = player.volume;
				const startTime = Date.now();

				const fadeOut = () => {
					const elapsed = Date.now() - startTime;
					const progress = Math.min(elapsed / duration, 1);
					player.volume = startVolume * (1 - progress);

					if (progress < 1) {
						player.fadeHandle = requestAnimationFrame(fadeOut);
					} else {
						player.volume = 0;
						player.pause();
						player.fadeHandle = null;
					}
				};

				player.fadeHandle = requestAnimationFrame(fadeOut);
			}
		}

		// Play
		if (layerData.a === "" || layerData.aa === "") {
			player.pause();
			player.currentTime = 0;
			return;
		}
		
		if (layerData.aa === "r") {
			player.currentTime = 0;
			player.play();
			return;
		}
		
		player.play().catch(error => console.log('Play error:', error));
	}
};
