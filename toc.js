
function slugify(text) {
	return text
		.trim()
		.toLowerCase()
		.normalize('NFKD')				// remove diacritical
		.replace(/[\u0300-\u036f]/g, '')// remove remaining diacriticals
		.replace(/[^a-z0-9 _-]/g, '')	// keep letters, digits, space, underscore, hyphen
		.replace(/\s+/g, '-')			// spaces -> hyphen
		.replace(/-+/g, '-')			//collapse multiple hyphens
		.replace(/^[-_]+|[-_]+$/g, '');	// trim
}

function buildTOC(content) {
	const selector = 'h1,h2,h3,h4,h5,h6';
	const headings = Array.from(content.querySelectorAll(selector));

	const usedIds = new Set(
		Array.from(document.querySelectorAll('[id]')).map(el => el.id)
	);

	const toc = []; // { text, level, id, element }
	const idCounts = {}; // for resolve collisions by the base slug

	headings.forEach((el, index) => {
		const tag = el.tagName.toLowerCase();
		const level = parseInt(tag.slice(1), 10);
		const text = el.textContent || ' ';

		let id = el.parentElement.getAttribute('id');
		if (!id) {
			// generate id from text
			const base = slugify(text) || `heading-${level}`;
			idCounts[base] = (idCounts[base] || 0) + 1;
			id = idCounts[base] === 1 ? base : `${base}-${idCounts[base]}`;

			// if exist - add suffix
			let suffix = 1;
			while (usedIds.has(id)) {
				id = `${base}-${idCounts[base]}-${suffix}`;
				suffix += 1;
			}

			el.id = id;
			usedIds.add(id);
			console.info(`new id: ${id}`, el);
		}

		toc.push({ text, level, id, element: el });
	});
	//console.log(toc);
	return toc;
}

function insert_TOC_to(toc, container, options = {}) {
	const {
		navID = 'table-of-contents',
		title = 'Оглавление',
		titleTag = 'h3',
		smoothScroll = false,
		maxDepth = 6, // h1-h6
		place = 'prepend' // 'prepend' | 'append'
	} = options;

	const nav = document.createElement('nav');
	nav.id = navID;
	nav.setAttribute('aria-label', 'Table of contents');

	const titleEl = document.createElement(titleTag);
	titleEl.textContent = title;
	nav.appendChild(titleEl);

	const rootOl = document.createElement('ul');
	nav.appendChild(rootOl);

	const stack = [{ level: 0, ol: rootOl }];

	toc.forEach(item => {
		if (item.level > maxDepth) return;

		const li = document.createElement('li');
		const a = document.createElement('a');
		a.textContent = item.text;
		a.href = `#${item.id}`;
		a.onclick =(e) => TOCsw(container.id, e);
		a.setAttribute('data-target-id', item.id);
		li.appendChild(a);

		// Find where to insert: move down/up the stack
		while (stack.length && item.level <= stack[stack.length - 1].level) {
			stack.pop();
		}

		const parentOl = stack[stack.length - 1].ol;
		parentOl.appendChild(li);

		// Create a new level (ol) and push it onto the stack for subsequent deeper headings
		const newOl = document.createElement('ul');
		li.appendChild(newOl);
		stack.push({ level: item.level, ol: newOl });
	});

	// clean empty ol
	nav.querySelectorAll('ul').forEach(ol => {
		if (!ol.children.length) ol.remove();
	});

	if (place === 'prepend') {
		if (container.firstChild) container.insertBefore(nav, container.firstChild);
		else container.appendChild(nav);
	} else {
		container.appendChild(nav);
	}

	nav.addEventListener('click', function (e) {
		const a = e.target.closest('a');
		if (!a) return;
		const targetId = a.getAttribute('data-target-id');
		const target = $(targetId);
		if (!target) return;
		e.preventDefault();
		go(target);
		history.replaceState(null, '', `#${targetId}`);
	});

	return nav;
}

let bShowTOC=false;
let navEl;
// TOC switcher: build, insert into container on demand, then toggle .hide
function TOCsw(containerID, options = {}) {
	bShowTOC=!bShowTOC;
	const defaults = {
		title: 'Содержание',
		smoothScroll: false,
		maxDepth: 6,
		navID: 'table-of-contents',
		titleTag: 'h2',
		place: 'prepend',
		updateIfExists: true,
		content: document
	};
	const opts = Object.assign({}, defaults, options);
	const host = $(containerID);
	if (!navEl) navEl = $(opts.navID);
	if (!navEl) navEl = insert_TOC_to(buildTOC(opts.content), host, opts);
	host.classList.toggle('hide', !bShowTOC);
	return navEl;
}