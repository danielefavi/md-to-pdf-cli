# md-to-pdf-cli

Convert Markdown files to styled PDFs with syntax highlighting, math rendering, and GitHub Flavored Markdown support.

## Install

```bash
# Global install — makes md-to-pdf available everywhere
npm install -g md-to-pdf-cli

# Or as a project dependency
npm install md-to-pdf-cli
```

Requires Node.js >= 18. Puppeteer downloads a bundled Chromium automatically.

## Usage

```bash
# If installed globally:
md-to-pdf-cli document.md

# If installed as a project dependency:
npx md-to-pdf-cli document.md

# Custom output and title
md-to-pdf-cli notes.md -o ~/Desktop/notes.pdf -t "Meeting Notes"

# US Letter, landscape
md-to-pdf-cli report.md -f Letter --landscape

# Custom margins
md-to-pdf-cli slides.md --margin-top 10mm --margin-bottom 10mm --margin-left 10mm --margin-right 10mm

# Choose a built-in style or provide your own CSS
md-to-pdf-cli notes.md -s serif
md-to-pdf-cli notes.md -s markdown3
md-to-pdf-cli notes.md -s ./custom-theme.css
```

### Built-in styles

| Style | Description |
|-------|-------------|
| `default` | Clean sans-serif theme (used when no style is specified) |
| `serif` | Serif font theme |
| `markdown1` – `markdown9` | Alternative markdown themes with varying typography and layout |

```bash
# Example: use the serif style
md-to-pdf-cli report.md -s serif

# Example: use one of the numbered markdown styles
md-to-pdf-cli report.md -s markdown5

# Example: use a custom CSS file
md-to-pdf-cli report.md -s ./my-theme.css
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Output PDF path | `<input>.pdf` |
| `-t, --title <title>` | PDF metadata title | Filename |
| `-f, --format <format>` | `A4`, `Letter`, or `Legal` | `A4` |
| `-s, --style <name\|path>` | Built-in style name or path to `.css` file | `default` |
| `--landscape` | Landscape orientation | |
| `--margin-top/right/bottom/left` | Page margins (CSS units) | `20mm` |

## What it supports

- **GitHub Flavored Markdown** — tables, task lists, fenced code blocks, autolinks, strikethrough
- **Syntax highlighting** — Prism.js with Dracula theme. Supports TypeScript, JavaScript, Python, Go, Rust, Java, Bash, JSON, CSS, HTML/XML, YAML, SQL, and Diff. Unknown languages render as plain monospace.
- **Math** — inline (`$E = mc^2$`) and display (`$$...$$`) via KaTeX, automatically included when detected
- **Images** — relative image paths are resolved from the source file's directory

## Programmatic API

Each step of the pipeline is independently importable:

```typescript
import {
  convertMdToPdf,              // file → PDF file (end-to-end)
  convertMarkdownToPdfBuffer,  // string → PDF buffer
  parseMarkdown,               // string → HTML
  parseMarkdownFile,           // file → HTML
  wrapHtml,                    // HTML fragment → full document with styles
  generatePdf,                 // HTML → PDF buffer
  generatePdfToFile,           // HTML → PDF file
} from 'md-to-pdf-cli';

// End-to-end
await convertMdToPdf('README.md', { output: 'readme.pdf', format: 'A4' });

// Or step by step
const html = parseMarkdown('# Hello\n\nSome **bold** text.');
const doc = wrapHtml(html, { title: 'My Doc' });
const buffer = await generatePdf(doc, { format: 'Letter', landscape: true });
```

## Development

```bash
npm install
npm test             # run tests
npm run test:watch   # watch mode
npm run build        # production build
npm run dev          # build in watch mode
```

## License

MIT
