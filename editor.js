//TODO
//add tristate UI to edit dataset.q = ''|'-'| remove property
//add dataset.css
//refactor deduplicate const xr = row.querySelector

const edRowTpl = document.createElement('template');
edRowTpl.innerHTML = `
<div class="layer-row" data-name="">
	<span class="title"></span>
	<span class="small sep">: </span>
	<label class="small">RGB</label>
	<input class="bgColor" type="color" value="#000000" />
	<label class="small">A</label>
	<input class="alpha" type="range" min="0" max="1" step="0.01" value="1" />
	<span class="av small lval">1</span>
	<label class="small">URL/Color</label>
	<input class="valInput" type="text" placeholder="#000 or /img/x.webp" />

	<label class="small">X</label>
	<input class="x" type="range" min="-500" max="500" value="0" />
	<span class="xv small lval">0</span>

	<label class="small">Y</label>
	<input class="y" type="range" min="-500" max="500" value="0" />
	<span class="yv small lval">0</span>

	<label class="small">Z</label>
	<input class="z" type="range" min="0.1" max="5" step="0.1" value="1" />
	<span class="zv small lval">1</span>

	<span class="small sep">|</span>

	<label class="small">Text</label>
	<input class="textColor" type="color" value="#ffffff" />

	<button class="reset reset">Reset</button><button class="copy copy">Copy</button>
</div>
`;

const ed_footer=`<i style="float: right;">possible edit div b0 b1 b2 b3 in inspector atr-alt-i, then copy <button onclick="go()">to start</button> <button onclick="editor.resetAll()" class="reset">Reset All</button> <button class="copy-all" onclick="editor.copyAll(this)">Copy all</button></i>`;


editor={
	resetBtns:[],
	resetAll: function () {
		editor.resetBtns.forEach(btn => btn.click());
	}
};


const toHex = (val) => val.toString(16).padStart(2, '0');
function alphaToHex(a) {
	const v = Math.round(Math.max(0, Math.min(1, a)) * 255);
	return v.toString(16).padStart(2, '0');
}


//rgbaToHex("rgb(0, 0, 0)"); "rgba(110,0,0,0)"
const rgbaToHex = c => { 
	if (!c) return '';
	c = c.trim();
	if (c.startsWith('#')) return c;

	const m = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)$/i);
	if (!m) return c;

	const [r, g, b, a = 1] = m.slice(1, 5).map(val => Math.max(0, Math.min(255, Math.round(parseFloat(val)))));

	const hexColor = `${toHex(r)}${toHex(g)}${toHex(b)}`;
	return (isNaN(a) || a === 1)  ? `#${hexColor}` : `#${hexColor}${toHex(Math.round(a * 255))}`;
};


function edgui_sw(el){
	o.bEdgui_hide=!o.bEdgui_hide;
	edgui_hide(el, o.bEdgui_hide);
}
function edgui_hide(el,b){
	if(b!==undefined)o.bEdgui_hide=b;
	$("editorPanel").classList.toggle('hide', o.bEdgui_hide);
	if(el) el.innerText=o.bEdgui_hide?'❄️ edit':'✖';
}

function buildEditor(divId){
	const panel = $(divId);
	if(!panel){ console.log(divId+' not found, editor disabled'); return;}
	
	const parseXYZ = s => {
		if (!s) return ['0', '0', '1'];
		return s.split(/\s+/).concat(['0', '0', '1']).slice(0, 3);
	};

	const GUI2data = () => {
		applyLayerDataToView(getDrawCommandsFromDataset(o.laydataset)); // live preview
	};
	let b3textColor;
	const buildRow = (name) => {
		const node = edRowTpl.content.firstElementChild.cloneNode(true);
		node.dataset.name = name;
		node.querySelector('.title').textContent = name;

		const bgColor = node.querySelector('.bgColor');
		const valInput = node.querySelector('.valInput');
		const xr = node.querySelector('.x'), yr = node.querySelector('.y'), zr = node.querySelector('.z');
		const xv = node.querySelector('.xv'), yv = node.querySelector('.yv'), zv = node.querySelector('.zv');
		
		if (name === 'b3'){
			b3textColor = node.querySelector('.textColor');
			b3textColor.value = o.laydataset.c || '#ffffff';
			b3textColor.addEventListener('input', () => {
			o.laydataset.c = b3textColor.value;
			GUI2data();
			});
		}else
			node.querySelector('.textColor').style.display = 'none';
		
		const resetBtn = node.querySelector('.reset');
		editor.resetBtns.push(resetBtn);
		const copyBtn = node.querySelector('.copy');
		const alpha = node.querySelector('.alpha') || (() => {
			const input = document.createElement('input');
			input.type = 'range'; input.min = '0'; input.max = '1'; input.step = '0.01';
			input.className = 'alpha'; input.value = '1';
			bgColor.parentNode.insertBefore(input, valInput);
			return input;
		})();
		const av = node.querySelector('.av');

		// Load initial state
		const v = o.laydataset[name] || '';
		valInput.value = v;
		if (v.startsWith('#')) bgColor.value = v;

		alpha.value = 1;
		av.textContent = 1;

		const [x, y, z] = parseXYZ(o.laydataset[`${name}xyz`]);
		xr.value = x; yr.value = y; zr.value = z;
		xv.textContent = x; yv.textContent = y; zv.textContent = z;

		// Live updates
		alpha.addEventListener('input', () => {
			av.textContent = alpha.value;
			if(bgColor.value.startsWith('#'))
				valInput.value = bgColor.value+alphaToHex(parseFloat(alpha.value));
			o.laydataset[name] = valInput.value.trim();
			GUI2data();
		});

		[xr, yr, zr].forEach((input, i) => {
			input.addEventListener('input', () => {
				[xv, yv, zv][i].textContent = input.value;
				o.laydataset[`${name}xyz`] = `${xr.value} ${yr.value} ${zr.value}`;
				GUI2data();
			});
		});

		bgColor.addEventListener('input', () => {
			valInput.value = bgColor.value+alphaToHex(parseFloat(alpha.value));
			o.laydataset[name] = valInput.value.trim();
			GUI2data();
		});

		let typingTimer;
		valInput.addEventListener('input', () => {
			clearTimeout(typingTimer);
			typingTimer = setTimeout(() => {
				o.laydataset[name] = valInput.value.trim();
				GUI2data();
			}, 150);
		});
		valInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				o.laydataset[name] = valInput.value.trim();
				GUI2data();
			}
		});

		// Reset
		resetBtn.addEventListener('click', () => {
			//'' to reset css
			o.laydataset[name]='';
			o.laydataset[`${name}xyz`]='';
			o.laydataset.c='';
			applyLayerDataToView(getDrawCommandsFromDataset(o.laydataset));
			
			delete o.laydataset[name];
			delete o.laydataset[`${name}xyz`];
			if (name === 'b3') delete o.laydataset.c;
			valInput.value = '';
			bgColor.value = '#000000';
			alpha.value = av.textContent = 1;
			xr.value = yr.value = 0; zr.value = 1;
			xv.textContent = yv.textContent = 0; zv.textContent = 1;
		});

		// Copy
		copyBtn.addEventListener('click', async () => {
			const attrs = [];
			const dv = o.laydataset[name];
			const dxyz = o.laydataset[`${name}xyz`];
			const a = parseFloat(alpha.value);

			if (dv) {
				let out = dv;
				if (dv.startsWith('#') && a !== 1) {
					let h = dv.slice(1);
					if (h.length === 3) h = h.split('').map(c => c + c).join('');
					if (h.length === 6) out = `#${h}${alphaToHex(a)}`;
				}
				attrs.push(`data-${name}="${out}"`);
			}

			if (dxyz && dxyz.trim() !== '0 0 1') {
				attrs.push(`data-${name}xyz="${dxyz.trim()}"`);
			}

			if (name === 'b3' && o.laydataset.c) {
				attrs.push(`data-c="${o.laydataset.c}"`);
			}

			copyToClipboard(attrs.join(' '), copyBtn);
		});

		return node;
	};

	layNms.forEach(name => panel.appendChild(buildRow(name)));

	panel.insertAdjacentHTML('beforeend',ed_footer);
}
editor.copyAll= async function (btn){
const attrs = [];
for (const name of layNms) {
	const dv = o.laydataset[name];
	const dxyz = o.laydataset[`${name}xyz`];
	const row = document.querySelector(`.layer-row[data-name="${name}"]`);
	const a = row ? parseFloat(row.querySelector('.alpha').value) : 1;

	if (dv) {
		let out = dv;
		if (dv.startsWith('#') && a !== 1) {
			let h = dv.slice(1);
			if (h.length === 3) h = h.split('').map(c => c + c).join('');
			if (h.length === 6) out = `#${h}${alphaToHex(a)}`;
		}
		attrs.push(`data-${name}="${out}"`);
	}

	if (dxyz && dxyz.trim() !== '0 0 1') {
		attrs.push(`data-${name}xyz="${dxyz.trim()}"`);
	}
}
if (o.laydataset.c) attrs.push(`data-c="${o.laydataset.c}"`);
copyToClipboard(attrs.join(' '), btn);
}

editor.updateFromCSS = function() {
	const styleOf = (node, prop) => getComputedStyle(node).getPropertyValue(prop);
	
	const readBg = node => {
		const bgImage = getRelativeBackgroundImage(node);
		const bgColor = styleOf(node, 'background-color');
		const bgPos = styleOf(node, 'background-position');
		const bgSize = styleOf(node, 'background-size');
		const bgRepeat = styleOf(node, 'background-repeat');

		let b = '';
		if (bgImage && bgImage !== 'none') {
			const m = bgImage.match(/^url\((["']?)(.*)\1\)$/);
			b = m ? m[2] : bgImage;
		} else if (bgColor) {
			const hex = rgbaToHex(bgColor);
			b = hex || bgColor;
		}
		
		let xyz = '';
		if (bgImage && bgImage !== 'none') {
			const pos = bgPos || '';
			const size = bgSize || '';
			const posParts = pos.split(' ').map(p => p.replace(/px$/, ''));
			const x = posParts[0] || '0';
			const y = posParts[1] || '0';
			
			let z = '1';
			
			// Handle different background-size values
			if (size === 'cover' || size === 'contain') {
				z = size;
			} else if (size !== 'auto' && size !== '') {
				// Parse the size value to get scale
				const sizeParts = size.split(' ');
				if (sizeParts.length === 2) {
					const widthPart = sizeParts[0];
					const heightPart = sizeParts[1];
					
					// %
					if (widthPart.endsWith('%') && heightPart.endsWith('%')) {
						z = size; // Keep as percentage
					} 
					// px
					else if (widthPart.endsWith('px') && heightPart.endsWith('px')) {
						// Try to compute scale from image dimensions
						const img = new Image();
						img.src = b;
						img.onload = () => {
							const widthVal = parseFloat(widthPart);
							const heightVal = parseFloat(heightPart);
							const scaleX = widthVal / img.width;
							const scaleY = heightVal / img.height;
							
							// Update UI with computed scale
							const row = document.querySelector(`.layer-row[data-name="${Object.keys(targets).find(key => targets[key] === node)}"]`);
							if (row) {
								const zr = row.querySelector('.z');
								const zv = row.querySelector('.zv');
								zr.value = scaleX.toFixed(3);
								zv.textContent = scaleX.toFixed(3);
							}
						};
						z = '1';
					} else {
						z = size;
					}
				} else if (sizeParts.length === 1) {
					z = sizeParts[0];
				}
			} else {
				// When size is 'auto', check if we have a scale in data attribute
				const dataName = Object.keys(targets).find(key => targets[key] === node);
				if (dataName && o.laydataset[`${dataName}xyz`]) {
					const xyzParts = o.laydataset[`${dataName}xyz`].split(' ');
					if (xyzParts.length === 3) {
						z = xyzParts[2];
					}
				}
			}
			
			xyz = `${x} ${y} ${z}`;
		} else if (bgColor) {
			xyz = '';
		}
		return { b, xyz };
	};


const getRelativeBackgroundImage = (node) => {
	let bg = node.style.backgroundImage; //inline style
	if (bg) return extractUrl(bg);
	bg = getComputedStyle(node).backgroundImage;
	return extractUrl(bg);
};
const extractUrl = (s) => {
	const match = s.match(/url\(.(.*?).\)/);
	return match ? match[1] : '';
};

	for (const name of layNms) {
		const row = document.querySelector(`.layer-row[data-name="${name}"]`);
		if (!row) continue;

		const valInput = row.querySelector('.valInput');
		const bgColor = row.querySelector('.bgColor');
		const xr = row.querySelector('.x'), yr = row.querySelector('.y'), zr = row.querySelector('.z');
		const xv = row.querySelector('.xv'), yv = row.querySelector('.yv'), zv = row.querySelector('.zv');
		const alpha = row.querySelector('.alpha'), av = row.querySelector('.av');
		const textColor = row.querySelector('.textColor');

		const { b, xyz } = readBg(targets[name]);

		if(!b) valInput.value = '';
		//valInput.value = b ? b : '';
		// b like "rgba(255,255,255,0.333)" or "rgb(255,255,255)"
		
		const updateColor = (r, g, b, a = 1) => { // to Hex and update UI
			const hex = `#${[r, g, b].map(toHex).join('')}`;
			bgColor.value = hex;
			valInput.value = hex;
			alpha.value = a;
			av.textContent = a.toFixed(3);
		};

		if (b.startsWith('rgba')) {
			const m = b.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([01]?\.?\d*)\s*\)/);
			if (m) {
				const [_, r, g, bl, a] = m.map(Number);
				updateColor(r, g, bl, a);
			}
		} else if (b.startsWith('rgb')) {
			const m = b.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
			if (m) {
				const [_, r, g, bl] = m.map(Number);
				updateColor(r, g, bl, 1);
			}
		} else if (b.startsWith('#')) {
			bgColor.value = b.slice(0, 7);
			valInput.value = b;
			alpha.value = parseInt(b.slice(7, 9), 16) / 255;
			av.textContent = String(alpha.value);
		} else {
			const idx = b.indexOf('/');
			valInput.value = idx !== -1 ? '..' + b.slice(idx) : b;
		}


		if (xyz !== undefined) {
			if (xyz === '') {
				xr.value = 0; yr.value = 0; zr.value = 1;
				xv.textContent = 0; yv.textContent = 0; zv.textContent = 1;
			} else {
				const parts = xyz.trim().split(/\s+/);
				const [x = '0', y = '0', z = '1'] = parts;
				xr.value = parseInt(x);
				yr.value = parseInt(y);
				zr.value = parseFloat(z);
				xv.textContent = xr.value;
				yv.textContent = yr.value;
				zv.textContent = zr.value;
			}
		}

		if (name === b3s && textColor) {
			textColor.value = rgbaToHex(styleOf(b3, 'color')) || '';
		}
	}
}

buildEditor('editorPanel');