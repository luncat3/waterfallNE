## Waterfall NE

Hybrid ebook + visual novella + quest engine made with vanilla JS.

### Features

Single-format compatible with: EPUB, HTML (with or without JS), and audiobook (drop `voice` folder to your player).
Best for linear books, but cycles and branching are supported.

### Quick start (convert your book)
1. Paste text into index HTML file.
2. Gradually adjust scene changes using tags `<section>`, `<br>`, `<p>`.
3. Add images and sounds
4. Add styles.

### Cons
- Script instructions are mixed inside text content. To draw the quest graph need load and parse entire HTML. This may be challenge or fun.
- Need to sync scripts and all translations. Do not forget to update translation, otherwise you will never found what was changed and where.

### TODO
- Add option to auto-advance to the next page after audio ends (end of current text layer), Add pause on pages without text but with images. So it works as an audiobook player.
- better example
- Test, fix, make users happy and bug-free experience

### License
- allows training of AI, diffusion, and language models.
