# md-to-pdf-cli

Convert Markdown files to beautifully styled PDFs — with syntax highlighting, math rendering, and GitHub Flavored Markdown support.

**Built for AI agents** — this tool is tested and optimized for use by LLMs and AI coding agents. See the [Technical Reference for AI Agents](#technical-reference-for-ai-agents) section for structured integration details.

## Install

```bash
# Global install — makes md-to-pdf-cli available everywhere
npm install -g md-to-pdf-cli

# Or as a project dependency
npm install md-to-pdf-cli
```

Requires Node.js >= 18. Puppeteer downloads a bundled Chromium automatically.

## Quick Start

```bash
# Convert a Markdown file to PDF (outputs document.pdf alongside the source)
md-to-pdf-cli document.md

# Custom output path and title
md-to-pdf-cli notes.md -o ~/Desktop/notes.pdf -t "Meeting Notes"

# US Letter, landscape orientation
md-to-pdf-cli report.md -f Letter --landscape

# Custom margins
md-to-pdf-cli slides.md --margin-top 10mm --margin-bottom 10mm --margin-left 10mm --margin-right 10mm

# Use a built-in style or your own CSS
md-to-pdf-cli notes.md -s serif
md-to-pdf-cli notes.md -s markdown3
md-to-pdf-cli notes.md -s ./custom-theme.css
```

If installed locally (not globally), prefix commands with `npx`:

```bash
npx md-to-pdf-cli document.md
```

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Output PDF path | `<input>.pdf` |
| `-t, --title <title>` | PDF metadata title | Filename |
| `-f, --format <format>` | `A4`, `Letter`, or `Legal` | `A4` |
| `-s, --style <name\|path>` | Built-in style name or path to `.css` file | `default` |
| `--landscape` | Landscape orientation | `false` |
| `--margin-top <margin>` | Top margin (CSS units) | `20mm` |
| `--margin-right <margin>` | Right margin (CSS units) | `20mm` |
| `--margin-bottom <margin>` | Bottom margin (CSS units) | `20mm` |
| `--margin-left <margin>` | Left margin (CSS units) | `20mm` |
| `-l, --list-styles` | List available built-in styles | |

## Built-in Styles

| Style | Description |
|-------|-------------|
| `default` | Clean sans-serif theme (used when no style is specified) |
| `serif` | Serif font theme |
| `markdown1` – `markdown9` | Alternative themes with varying typography and layout |

```bash
md-to-pdf-cli report.md -s serif
md-to-pdf-cli report.md -s markdown5
md-to-pdf-cli report.md -s ./my-theme.css
```

## What It Supports

- **GitHub Flavored Markdown** — tables, task lists, fenced code blocks, autolinks, strikethrough
- **Syntax highlighting** — Prism.js with Dracula theme for TypeScript, JavaScript, Python, Go, Rust, Java, Bash, JSON, CSS, HTML/XML, YAML, SQL, and Diff
- **Math** — inline (`$E = mc^2$`) and display (`$$...$$`) via KaTeX, automatically included only when detected
- **Images** — relative paths resolved from the source file's directory

## Programmatic API

Each step of the conversion pipeline is independently importable:

```typescript
import {
  convertMdToPdf,              // file path → PDF file (end-to-end)
  convertMarkdownToPdfBuffer,  // markdown string → PDF buffer
  parseMarkdown,               // markdown string → HTML string
  parseMarkdownFile,           // file path → HTML string
  wrapHtml,                    // HTML fragment → full HTML document with styles
  generatePdf,                 // full HTML → PDF buffer
  generatePdfToFile,           // full HTML → PDF file
} from 'md-to-pdf-cli';
```

### End-to-end conversion

```typescript
// File to PDF file — returns the output path
const outputPath = await convertMdToPdf('README.md', {
  output: 'readme.pdf',
  format: 'A4',
  style: 'serif',
});

// String to PDF buffer — useful for HTTP responses or streaming
const buffer = await convertMarkdownToPdfBuffer('# Hello\n\nWorld.', {
  title: 'My Doc',
  format: 'Letter',
  landscape: true,
});
```

### Step-by-step usage

```typescript
// 1. Parse Markdown to HTML
const html = parseMarkdown('# Hello\n\nSome **bold** text.');

// 2. Wrap in a full HTML document with styles
const doc = wrapHtml(html, { title: 'My Doc', style: 'serif' });

// 3. Generate PDF
const buffer = await generatePdf(doc, { format: 'Letter', landscape: true });
// or write directly to file:
await generatePdfToFile(doc, 'output.pdf', { format: 'A4' });
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

---

<!-- AI-AGENT REFERENCE — structured technical specification below -->

## Technical Reference for AI Agents

> This section provides structured, precise technical details optimized for LLM and AI agent consumption. For human-readable docs, see sections above.

### Project Metadata

- **Package**: `md-to-pdf-cli` v0.1.0
- **Module system**: ESM (`"type": "module"`)
- **Node.js**: >= 18
- **npm**: `npm install md-to-pdf-cli`
- **License**: MIT
- **Entry point**: `dist/index.js`
- **Types**: `dist/index.d.ts`
- **CLI binary**: `dist/bin/md-to-pdf.js` (registered as `md-to-pdf-cli`)

### Conversion Pipeline

The tool converts Markdown to PDF through a 4-stage pipeline. Each stage is an independent, exported function:

```
Markdown string/file
  → [parseMarkdown / parseMarkdownFile] → HTML fragment
  → [wrapHtml] → Full HTML document (with CSS, Prism theme, optional KaTeX CSS)
  → [generatePdf / generatePdfToFile] → PDF buffer/file
```

Orchestrators that run the full pipeline:
- `convertMdToPdf(inputPath, options?)` — file → PDF file
- `convertMarkdownToPdfBuffer(markdown, options?)` — string → PDF buffer

### Exported Functions and Types

```typescript
// --- Parser (src/parser.ts) ---
function parseMarkdown(markdown: string, options?: ParseOptions): string
// Synchronous. Uses marked with async:false, GFM enabled by default.
// Applies Prism.js syntax highlighting via custom renderer.
// KaTeX math via marked-katex-extension.

function parseMarkdownFile(filePath: string, options?: ParseOptions): Promise<string>
// Reads file, validates extension (.md or .markdown), calls parseMarkdown.

interface ParseOptions {
  gfm?: boolean  // default: true
}

// --- Template (src/template.ts) ---
function wrapHtml(contentHtml: string, options?: WrapHtmlOptions): string
// Wraps HTML fragment in <!DOCTYPE html> with:
//   - Base CSS or named/custom style CSS (via resolveStyleCss)
//   - Prism Dracula theme CSS
//   - KaTeX CSS (only if class="katex" found in content)

interface WrapHtmlOptions {
  title?: string   // default: "Document"
  style?: string   // "default" | "serif" | "markdown1"-"markdown9" | path to .css file
}

// --- PDF Generation (src/pdf.ts) ---
function generatePdf(html: string, options?: PdfOptions): Promise<Buffer>
// Launches headless Chromium via Puppeteer.
// If basePath is set: writes HTML to temp file with <base href> for relative image resolution.
// Otherwise: uses page.setContent.
// Adds --no-sandbox flags when process.env.CI is set.

function generatePdfToFile(html: string, outputPath: string, options?: PdfOptions): Promise<void>
// Calls generatePdf, writes buffer to outputPath.

interface PdfOptions {
  format?: 'A4' | 'Letter' | 'Legal'           // default: 'A4'
  landscape?: boolean                            // default: false
  margin?: { top?: string; right?: string; bottom?: string; left?: string }  // default: 20mm all
  printBackground?: boolean                      // default: true
  basePath?: string                              // directory for resolving relative image paths
}

// --- Orchestrators (src/index.ts) ---
function convertMdToPdf(inputPath: string, options?: ConvertOptions): Promise<string>
// Returns the output file path.

function convertMarkdownToPdfBuffer(markdown: string, options?: ConvertOptions): Promise<Buffer>

interface ConvertOptions {
  output?: string                                // output path; default: <input>.pdf
  title?: string                                 // default: filename (convertMdToPdf) or "Document" (buffer)
  style?: string                                 // style name or .css path
  format?: 'A4' | 'Letter' | 'Legal'
  landscape?: boolean
  margin?: { top?: string; right?: string; bottom?: string; left?: string }
}
```

### Styles System

- **Default style**: hardcoded CSS constant in `src/styles.ts` — clean sans-serif, 800px max-width, GFM table/checklist/blockquote/code styling
- **Built-in styles**: `.css` files in `src/styles/` (copied to `dist/styles/` at build): `serif`, `markdown1` through `markdown9`
- **Custom styles**: pass any `.css` file path
- **Resolution**: `resolveStyleCss(style?)` in `src/styles.ts` — returns CSS string, cached in a `Map` after first load
- **Prism theme**: Dracula, inlined as `PRISM_DRACULA_CSS` constant
- **KaTeX CSS**: loaded on-demand from `katex/dist/katex.min.css` via `createRequire`, only injected when `class="katex"` is detected in content

### Supported Syntax Highlighting Languages

TypeScript, JavaScript, Python, Go, Rust, Java, Bash, JSON, CSS, HTML/XML (markup), YAML, SQL, Diff. Unknown languages render as escaped plain monospace.

### File Structure

```
src/
  index.ts      — orchestrators + re-exports
  parser.ts     — Markdown → HTML (marked + Prism.js + KaTeX)
  template.ts   — HTML fragment → full HTML document
  pdf.ts        — HTML → PDF (Puppeteer)
  styles.ts     — CSS constants, style resolution, KaTeX CSS loader
  styles/       — built-in .css theme files
bin/
  md-to-pdf.ts  — CLI entry point (Commander)
tests/          — Vitest test files
```

### Build System

- **Bundler**: tsup (ESM only, target node18)
- **Entry points**: `src/index.ts` → `dist/index.js`, `bin/md-to-pdf.ts` → `dist/bin/md-to-pdf.js`
- **Post-build**: `cp -r src/styles dist/` (styles not handled by tsup)
- **TypeScript**: strict mode with `noUncheckedIndexedAccess`

### Dependencies

| Package | Role |
|---------|------|
| `marked` | Markdown parser (GFM) |
| `marked-katex-extension` | KaTeX math rendering in marked |
| `prismjs` | Syntax highlighting |
| `katex` | Math typesetting |
| `puppeteer` | Headless Chromium for PDF generation |
| `commander` | CLI argument parsing |

### CLI Invocation Pattern

```
md-to-pdf-cli <input> [options]

Arguments:
  input                    Markdown file to convert (.md or .markdown)

Options:
  -o, --output <path>      Output PDF file path (default: <input>.pdf)
  -t, --title <title>      Document title
  -f, --format <format>    Page format: A4 | Letter | Legal (default: A4)
  -s, --style <name|path>  Style: default | serif | markdown1-9 | path/to/file.css
  --landscape              Landscape orientation
  --margin-top <margin>    Top margin, e.g. "20mm" (default: 20mm)
  --margin-right <margin>  Right margin (default: 20mm)
  --margin-bottom <margin> Bottom margin (default: 20mm)
  --margin-left <margin>   Left margin (default: 20mm)
  -l, --list-styles        List available built-in styles
  -V, --version            Output version number
  -h, --help               Display help
```

### Common Integration Patterns

```typescript
// Generate PDF in an Express route
app.get('/pdf', async (req, res) => {
  const buffer = await convertMarkdownToPdfBuffer(markdownString, {
    format: 'A4',
    title: 'Report',
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.send(buffer);
});

// Batch convert multiple files
import { convertMdToPdf } from 'md-to-pdf-cli';
const files = ['doc1.md', 'doc2.md', 'doc3.md'];
for (const file of files) {
  const output = await convertMdToPdf(file, { style: 'serif' });
  console.log(`Created: ${output}`);
}
```
