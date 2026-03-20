# md-to-pdf-cli

Convert Markdown files to styled PDFs with syntax highlighting, math rendering, and GitHub Flavored Markdown support.

## Install

```bash
npm install
npm run build
```

Requires Node.js >= 18. Puppeteer downloads a bundled Chromium automatically.

## Usage

```bash
# Basic conversion — outputs document.pdf in the same directory
md-to-pdf document.md

# Custom output and title
md-to-pdf notes.md -o ~/Desktop/notes.pdf -t "Meeting Notes"

# US Letter, landscape
md-to-pdf report.md -f Letter --landscape

# Custom margins
md-to-pdf slides.md --margin-top 10mm --margin-bottom 10mm --margin-left 10mm --margin-right 10mm

# Choose a built-in style or provide your own CSS
md-to-pdf notes.md -s serif
md-to-pdf notes.md -s ./custom-theme.css
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
