# md-to-pdf

Convert Markdown files to beautifully styled PDF documents. Features syntax highlighting (Prism.js with Dracula theme), math rendering (KaTeX), GFM support, and professional typography — all powered by Puppeteer.

## Installation

```bash
npm install
npm run build
```

Requires Node.js >= 18. Puppeteer will download a bundled Chromium on install.

## Quick Start

```bash
# Convert a markdown file to PDF
node dist/bin/md-to-pdf.js document.md

# Output: document.pdf in the same directory
```

## CLI Usage

```
md-to-pdf [options] <input>
```

### Arguments

| Argument | Description |
|----------|-------------|
| `input` | Path to the Markdown file (`.md` or `.markdown`) |

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Output PDF file path | `<input>.pdf` |
| `-t, --title <title>` | Document title (appears in PDF metadata) | Filename without extension |
| `-f, --format <format>` | Page format: `A4`, `Letter`, or `Legal` | `A4` |
| `--landscape` | Use landscape orientation | Portrait |
| `--margin-top <margin>` | Top margin (e.g. `20mm`, `1in`) | `20mm` |
| `--margin-right <margin>` | Right margin | `20mm` |
| `--margin-bottom <margin>` | Bottom margin | `20mm` |
| `--margin-left <margin>` | Left margin | `20mm` |
| `-V, --version` | Show version number | |
| `-h, --help` | Show help | |

### Examples

```bash
# Basic conversion
md-to-pdf notes.md

# Custom output path and title
md-to-pdf notes.md -o ~/Desktop/notes.pdf -t "Meeting Notes"

# US Letter format, landscape
md-to-pdf report.md -f Letter --landscape

# Tight margins for maximum content area
md-to-pdf slides.md --margin-top 10mm --margin-bottom 10mm --margin-left 10mm --margin-right 10mm
```

## Programmatic API

The library exposes composable functions so you can use each step of the pipeline independently.

### `convertMdToPdf(inputPath, options?)`

End-to-end conversion: reads a `.md` file and writes a `.pdf`.

```typescript
import { convertMdToPdf } from 'md-to-pdf';

const outputPath = await convertMdToPdf('README.md', {
  output: 'readme.pdf',
  title: 'Project README',
  format: 'A4',
  landscape: false,
  margin: { top: '25mm', right: '20mm', bottom: '25mm', left: '20mm' },
});
console.log(`Saved to ${outputPath}`);
```

### `convertMarkdownToPdfBuffer(markdown, options?)`

Converts a markdown **string** directly to a PDF `Buffer` — useful for HTTP responses or piping.

```typescript
import { convertMarkdownToPdfBuffer } from 'md-to-pdf';

const buffer = await convertMarkdownToPdfBuffer('# Hello World\n\nSome **bold** text.');
// buffer is a Node.js Buffer containing valid PDF bytes
```

### `parseMarkdown(markdown, options?)`

Parses a markdown string to HTML. Includes Prism syntax highlighting and KaTeX math rendering.

```typescript
import { parseMarkdown } from 'md-to-pdf';

const html = parseMarkdown('# Title\n\n```typescript\nconst x = 1;\n```');
// Returns HTML string with highlighted code blocks
```

Options:
- `gfm` (boolean, default `true`) — Enable GitHub Flavored Markdown (tables, strikethrough, etc.)

### `parseMarkdownFile(filePath, options?)`

Reads a `.md` or `.markdown` file from disk and parses it to HTML. Throws if the file doesn't exist or has an unsupported extension.

```typescript
import { parseMarkdownFile } from 'md-to-pdf';

const html = await parseMarkdownFile('./docs/guide.md');
```

### `wrapHtml(contentHtml, options?)`

Wraps an HTML fragment in a complete `<!DOCTYPE html>` document with all styles applied (typography, code highlighting, tables, math, etc.).

```typescript
import { wrapHtml } from 'md-to-pdf';

const fullPage = wrapHtml('<h1>Hello</h1><p>World</p>', { title: 'My Page' });
// Returns a complete HTML document ready for PDF generation
```

Options:
- `title` (string, default `"Document"`) — Sets the `<title>` tag

### `generatePdf(html, options?)`

Converts a full HTML string to a PDF `Buffer` using headless Chromium via Puppeteer.

```typescript
import { generatePdf } from 'md-to-pdf';

const pdfBuffer = await generatePdf('<html><body><h1>Hello</h1></body></html>', {
  format: 'Letter',
  landscape: true,
  margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
  printBackground: true,
});
```

### `generatePdfToFile(html, outputPath, options?)`

Same as `generatePdf` but writes the result directly to a file.

```typescript
import { generatePdfToFile } from 'md-to-pdf';

await generatePdfToFile(fullHtml, './output.pdf', { format: 'A4' });
```

### PDF Options

All PDF generation functions accept these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `'A4' \| 'Letter' \| 'Legal'` | `'A4'` | Page size |
| `landscape` | `boolean` | `false` | Landscape orientation |
| `margin` | `{ top?, right?, bottom?, left? }` | `20mm` all | Page margins (CSS units) |
| `printBackground` | `boolean` | `true` | Include background colors/images |

## Markdown Features

### Standard Markdown
- Headings (`# H1` through `###### H6`)
- **Bold**, *italic*, ~~strikethrough~~
- Ordered and unordered lists
- Links and images
- Blockquotes
- Horizontal rules

### GitHub Flavored Markdown (GFM)
- Tables with header alignment
- Task lists / checklists
- Fenced code blocks with language identifiers
- Autolinks

### Syntax Highlighting

Fenced code blocks with a language identifier are highlighted using Prism.js with the Dracula color theme:

````markdown
```typescript
interface User {
  name: string;
  age: number;
}

function greet(user: User): string {
  return `Hello, ${user.name}!`;
}
```
````

**Supported languages:** TypeScript, JavaScript, Python, Go, Rust, Java, Bash, JSON, CSS, HTML/XML (markup), YAML, SQL, Diff.

Unknown languages render as plain monospace text without crashing.

### Math Rendering

Inline and display math via KaTeX:

```markdown
Inline math: $E = mc^2$

Display math:
$$\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$
```

KaTeX CSS and fonts are automatically included when math expressions are detected.

## Styling

PDFs are styled with a carefully curated stylesheet inspired by [Notesnook](https://notesnook.com/):

- **Typography** — Open Sans font family with clean heading hierarchy
- **Code blocks** — Hack/Consolas monospace font with Dracula syntax theme on dark background
- **Inline code** — Light gray background with subtle border
- **Tables** — Collapsed borders, alternating header background
- **Blockquotes** — Left border accent
- **Checklists** — Custom SVG checkbox icons
- **Print-optimized** — `@page` margins, `pre` word-wrap for long code lines

## Architecture

The conversion pipeline is modular and each step is independently usable:

```
                                    ┌──────────────┐
  .md file ──► parseMarkdownFile ──►│  HTML string │
                                    │  (with Prism │
  md string ─► parseMarkdown ──────►│   + KaTeX)   │
                                    └──────┬───────┘
                                           │
                                     wrapHtml(html)
                                           │
                                    ┌──────▼───────┐
                                    │  Full HTML   │
                                    │  document    │
                                    │  (with CSS)  │
                                    └──────┬───────┘
                                           │
                                    generatePdf(html)
                                           │
                                    ┌──────▼───────┐
                                    │  PDF Buffer  │──► file or response
                                    └──────────────┘
```

### Project Structure

```
md-to-pdf/
├── bin/
│   └── md-to-pdf.ts           # CLI entry point (commander)
├── src/
│   ├── index.ts                # Public API: convertMdToPdf(), re-exports
│   ├── parser.ts               # MD → HTML (marked + Prism + KaTeX)
│   ├── template.ts             # HTML fragment → full styled document
│   ├── pdf.ts                  # HTML → PDF buffer (puppeteer)
│   └── styles.ts               # CSS constants + KaTeX CSS loader
├── tests/
│   ├── parser.test.ts          # 20 tests: markdown, Prism, KaTeX
│   ├── template.test.ts        # 11 tests: HTML structure, CSS, KaTeX inclusion
│   ├── pdf.test.ts             # 9 tests: mocked unit + real integration
│   ├── index.test.ts           # 4 tests: end-to-end file conversion
│   ├── cli.test.ts             # 2 tests: --help, --version
│   └── setup.test.ts           # 1 test: sanity check
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build
npm run build

# Build in watch mode
npm run dev
```

### Tech Stack

- **TypeScript** with strict mode, ESM (`"type": "module"`)
- **marked** — Markdown parsing with GFM support
- **Prism.js** — Syntax highlighting (Dracula theme)
- **KaTeX** — LaTeX math rendering (via `marked-katex-extension`)
- **Puppeteer** — Headless Chromium for HTML-to-PDF
- **Commander** — CLI argument parsing
- **tsup** — TypeScript bundling
- **Vitest** — Testing (47 tests)

## License

MIT
