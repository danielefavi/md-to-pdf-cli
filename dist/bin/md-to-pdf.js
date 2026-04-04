#!/usr/bin/env node
import { Command } from 'commander';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { basename, join, dirname, resolve, extname } from 'path';
import { readFile, writeFile, mkdtemp, rm } from 'fs/promises';
import { marked, Renderer } from 'marked';
import markedKatex from 'marked-katex-extension';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-sql.js';
import 'prismjs/components/prism-diff.js';
import { createRequire } from 'module';
import puppeteer from 'puppeteer';
import { tmpdir } from 'os';

marked.use(markedKatex({ throwOnError: false }));
var renderer = new Renderer();
renderer.code = function({ text, lang }) {
  const language = lang ?? "";
  const grammar = language ? Prism.languages[language] : void 0;
  if (grammar) {
    const highlighted = Prism.highlight(text, grammar, language);
    return `<pre class="language-${language}"><code class="language-${language}">${highlighted}</code></pre>
`;
  }
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `<pre><code${language ? ` class="language-${language}"` : ""}>${escaped}</code></pre>
`;
};
function parseMarkdown(markdown, options) {
  const result = marked.parse(markdown, {
    gfm: true,
    async: false,
    renderer
  });
  if (typeof result !== "string") {
    throw new Error("Unexpected async result from marked.parse");
  }
  return result;
}
async function parseMarkdownFile(filePath, options) {
  const ext = extname(filePath).toLowerCase();
  if (ext !== ".md" && ext !== ".markdown") {
    throw new Error(`Unsupported file extension "${ext}". Expected .md or .markdown`);
  }
  const content = await readFile(filePath, "utf-8");
  return parseMarkdown(content);
}
var CSS = `
    .image-container {
      display: block;
    }
    .image-container.align-right {
      display: flex;
      justify-content: end;
    }
    .image-container.align-center {
      display: flex;
      justify-content: center;
    }
    .image-container.float {
      float: left;
    }
    .image-container.float.align-right {
      float: right;
    }

    body {
      background-color: #fff;
      color: #202124;
      font-family: "Open Sans", "Noto Sans", Frutiger, Calibri, Myriad, Arial, Ubuntu, Helvetica, -apple-system, BlinkMacSystemFont, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.6;
    }

    .math-block {
      padding-top: 20px;
      padding-bottom: 20px;
    }

    h1, h2, h3, h4, h5, h6 {
      color: #212121;
    }

    p {
      margin-bottom: 0px;
    }

    p[data-spacing="double"] {
      margin-top: 1em;
    }

    p[data-spacing="single"] {
      margin-top: 0px;
    }

    p[data-spacing="single"]:empty {
      margin-top: 1em;
    }

    pre.codeblock {
      overflow-x: auto;
    }

    iframe {
      max-width: 100% !important;
      background-color: transparent !important;
    }

    li > p {
      margin-top: 0px;
      margin-bottom: 10px;
    }

    .checklist > li {
      list-style: none;
      margin: 0.25em 0;
    }

    .checklist > li::before {
      content: url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cg%20id%3D%22checklist-unchecked%22%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Crect%20id%3D%22Rectangle%22%20width%3D%2215%22%20height%3D%2215%22%20x%3D%22.5%22%20y%3D%22.5%22%20fill-rule%3D%22nonzero%22%20stroke%3D%22%234C4C4C%22%20rx%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E%0A");
      cursor: pointer;
      height: 1.1em;
      margin-left: -2.5em;
      margin-top: 0em;
      position: absolute;
      width: 1.5em;
      padding-left: 1em;
    }

    .checklist li.checked::before {
      content: url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cg%20id%3D%22checklist-checked%22%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Crect%20id%3D%22Rectangle%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%23008837%22%20fill-rule%3D%22nonzero%22%20rx%3D%222%22%2F%3E%3Cpath%20id%3D%22Path%22%20fill%3D%22%23FFF%22%20fill-rule%3D%22nonzero%22%20d%3D%22M11.5703186%2C3.14417309%20C11.8516238%2C2.73724603%2012.4164781%2C2.62829933%2012.83558%2C2.89774797%20C13.260121%2C3.17069355%2013.3759736%2C3.72932262%2013.0909105%2C4.14168582%20L7.7580587%2C11.8560195%20C7.43776896%2C12.3193404%206.76483983%2C12.3852142%206.35607322%2C11.9948725%20L3.02491697%2C8.8138662%20C2.66090143%2C8.46625845%202.65798871%2C7.89594698%203.01850234%2C7.54483354%20C3.373942%2C7.19866177%203.94940006%2C7.19592841%204.30829608%2C7.5386474%20L6.85276923%2C9.9684299%20L11.5703186%2C3.14417309%20Z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E%0A");
    }

    .checklist li.checked {
      color: #505050;
    }

    [dir="rtl"] .checklist > li::before {
      margin-left: 0;
      margin-right: -1.5em;
    }

    blockquote {
      border-left: 5px solid #e5e5e5;
      padding-left: 10px;
      margin-top: 0px;
    }

    code:not(pre code) {
      background-color: #f7f7f7;
      border: 1px solid #e5e5e5;
      border-radius: 5px;
      padding: 3px 5px 0px 5px;
      font-family: Hack, Consolas, "Andale Mono", "Lucida Console", "Liberation Mono", "Courier New", Courier, monospace !important;
      font-size: 10pt !important;
    }

    pre {
      padding: 10px;
      background-color: #e5e5e5;
      border-radius: 5px;
      font-family: Hack, Consolas, "Andale Mono", "Lucida Console", "Liberation Mono", "Courier New", Courier, monospace !important;
      font-size: 9pt !important;
      margin-bottom: 16px !important;
    }

    table {
      border-collapse: collapse;
      margin: 0;
      overflow: hidden;
      table-layout: fixed;
      width: 100%;
    }

    table td,
    table th {
      border: 1px solid #e5e5e5;
      box-sizing: border-box;
      min-width: 1em;
      padding: 3px 5px;
      position: relative;
      vertical-align: top;
    }

    table td > *,
    table th > * {
      margin-bottom: 0;
    }

    table th {
      background-color: #f7f7f7;
      font-weight: bold;
      text-align: left;
    }

    table p {
      margin: 0;
    }

    @page {
      margin: 20mm;
    }

    @media print {
      body {
        max-width: none;
      }
      pre {
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        overflow: visible !important;
      }
      pre code {
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
      }
    }
`;
var PRISM_DRACULA_CSS = `code[class*=language-],pre[class*=language-]{color:#f8f8f2;background:0 0;text-shadow:0 1px rgba(0,0,0,.3);font-family:Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;word-wrap:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none}pre[class*=language-]{padding:1em;margin:.5em 0;overflow:auto;border-radius:.3em}:not(pre)>code[class*=language-],pre[class*=language-]{background:#282a36}:not(pre)>code[class*=language-]{padding:.1em;border-radius:.3em;white-space:normal}.token.cdata,.token.comment,.token.doctype,.token.prolog{color:#6272a4}.token.punctuation{color:#f8f8f2}.namespace{opacity:.7}.token.constant,.token.deleted,.token.property,.token.symbol,.token.tag{color:#ff79c6}.token.boolean,.token.number{color:#bd93f9}.token.attr-name,.token.builtin,.token.char,.token.inserted,.token.selector,.token.string{color:#50fa7b}.language-css .token.string,.style .token.string,.token.entity,.token.operator,.token.url,.token.variable{color:#f8f8f2}.token.atrule,.token.attr-value,.token.class-name,.token.function{color:#f1fa8c}.token.keyword{color:#8be9fd}.token.important,.token.regex{color:#ffb86c}.token.bold,.token.important{font-weight:700}.token.italic{font-style:italic}.token.entity{cursor:help}`;
function findStylesDir() {
  let dir = dirname(fileURLToPath(import.meta.url));
  const root = resolve("/");
  while (dir !== root) {
    const candidate = join(dir, "styles");
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error(`Could not find styles/ directory relative to ${dirname(fileURLToPath(import.meta.url))}`);
}
var _stylesDir = null;
function getStylesDir() {
  if (!_stylesDir) _stylesDir = findStylesDir();
  return _stylesDir;
}
function getBuiltInStyles() {
  const dir = getStylesDir();
  return [
    "default",
    ...readdirSync(dir).filter((f) => f.endsWith(".css")).map((f) => f.replace(/\.css$/, "")).sort()
  ];
}
var _styleCssCache = /* @__PURE__ */ new Map();
function resolveStyleCss(style) {
  if (!style || style === "default") return CSS;
  if (style.endsWith(".css")) {
    const cached = _styleCssCache.get(style);
    if (cached) return cached;
    const css = readFileSync(style, "utf-8");
    _styleCssCache.set(style, css);
    return css;
  }
  const cssPath = join(getStylesDir(), `${style}.css`);
  if (existsSync(cssPath)) {
    const cached = _styleCssCache.get(style);
    if (cached) return cached;
    const css = readFileSync(cssPath, "utf-8");
    _styleCssCache.set(style, css);
    return css;
  }
  throw new Error(
    `Unknown style "${style}". Built-in styles: ${getBuiltInStyles().join(", ")}. Or provide a path to a .css file.`
  );
}
var _katexCss = null;
function getKatexCss() {
  if (_katexCss) return _katexCss;
  const req = createRequire(import.meta.url);
  const katexCssPath = req.resolve("katex/dist/katex.min.css");
  _katexCss = readFileSync(katexCssPath, "utf-8");
  return _katexCss;
}

// src/template.ts
function wrapHtml(contentHtml, options) {
  const title = options?.title ?? "Document";
  let extraCss = "";
  if (contentHtml.includes('class="katex"')) {
    try {
      extraCss = `<style>${getKatexCss()}</style>`;
    } catch {
    }
  }
  return `<!DOCTYPE html>
<html lang="en-US">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>${resolveStyleCss(options?.style)}</style>
    <style>${PRISM_DRACULA_CSS}</style>
    ${extraCss}
  </head>
  <body>
    ${contentHtml}
  </body>
</html>`;
}
var DEFAULT_MARGIN = { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" };
async function generatePdf(html, options) {
  const browser = await puppeteer.launch({
    headless: true,
    args: process.env.CI ? ["--no-sandbox", "--disable-setuid-sandbox"] : []
  });
  let tempDir;
  try {
    const page = await browser.newPage();
    if (options?.basePath) {
      tempDir = await mkdtemp(join(tmpdir(), "md-to-pdf-"));
      const tempHtmlPath = join(tempDir, "index.html");
      const baseUrl = pathToFileURL(options.basePath + "/").href;
      html = html.replace("<head>", `<head>
    <base href="${baseUrl}" />`);
      await writeFile(tempHtmlPath, html);
      await page.goto(pathToFileURL(tempHtmlPath).href, { waitUntil: "networkidle0" });
    } else {
      await page.setContent(html, { waitUntil: "networkidle0" });
    }
    const pdfBuffer = await page.pdf({
      format: options?.format ?? "A4",
      landscape: options?.landscape ?? false,
      margin: options?.margin ?? DEFAULT_MARGIN,
      printBackground: options?.printBackground ?? true
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  }
}
async function generatePdfToFile(html, outputPath, options) {
  const buffer = await generatePdf(html, options);
  await writeFile(outputPath, buffer);
}

// src/index.ts
async function convertMdToPdf(inputPath, options) {
  const html = await parseMarkdownFile(inputPath);
  const filename = basename(inputPath, inputPath.endsWith(".markdown") ? ".markdown" : ".md");
  const title = options?.title ?? filename;
  const fullHtml = wrapHtml(html, { title, style: options?.style });
  const outputPath = options?.output ?? join(dirname(inputPath), `${filename}.pdf`);
  await generatePdfToFile(fullHtml, outputPath, {
    format: options?.format,
    landscape: options?.landscape,
    margin: options?.margin,
    basePath: resolve(dirname(inputPath))
  });
  return outputPath;
}

// bin/md-to-pdf.ts
function getVersion() {
  return "1.3.3";
}
var program = new Command();
program.name("md-to-pdf").description("Convert Markdown files to styled PDF documents").version(getVersion()).argument("[input]", "Markdown file to convert").option("-o, --output <path>", "Output PDF file path").option("-t, --title <title>", "Document title").option("-f, --format <format>", "Page format (A4, Letter, Legal)", "A4").option("--landscape", "Use landscape orientation").option("--margin-top <margin>", "Top margin (e.g. 20mm)").option("--margin-right <margin>", "Right margin (e.g. 20mm)").option("--margin-bottom <margin>", "Bottom margin (e.g. 20mm)").option("--margin-left <margin>", "Left margin (e.g. 20mm)").option("-s, --style <name-or-path>", `Style name (${getBuiltInStyles().join(", ")}) or path to .css file`).option("-l, --list-styles", "List available styles").action(async (input, opts) => {
  try {
    if (opts.listStyles) {
      console.log("Available styles:\n");
      for (const style of getBuiltInStyles()) {
        console.log(`  ${style}`);
      }
      process.exit(0);
    }
    if (!input) {
      program.error("missing required argument: input");
      return;
    }
    const margin = opts.marginTop || opts.marginRight || opts.marginBottom || opts.marginLeft ? {
      top: opts.marginTop ?? "20mm",
      right: opts.marginRight ?? "20mm",
      bottom: opts.marginBottom ?? "20mm",
      left: opts.marginLeft ?? "20mm"
    } : void 0;
    const outputPath = await convertMdToPdf(input, {
      output: opts.output,
      title: opts.title,
      style: opts.style,
      format: opts.format,
      landscape: opts.landscape,
      margin
    });
    console.log(`PDF saved to ${outputPath}`);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
});
program.parse();
//# sourceMappingURL=md-to-pdf.js.map
//# sourceMappingURL=md-to-pdf.js.map