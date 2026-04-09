import { extname, join, basename, dirname, resolve } from 'path';
import { readFile, mkdtemp, writeFile, rm } from 'fs/promises';
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
import { readFileSync, existsSync, readdirSync } from 'fs';
import { pathToFileURL, fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { tmpdir } from 'os';

// src/index.ts
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
    gfm: options?.gfm ?? true,
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
  return parseMarkdown(content, options);
}
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
  return readdirSync(dir).filter((f) => f.endsWith(".css")).map((f) => f.replace(/\.css$/, "")).sort();
}
var _styleCssCache = /* @__PURE__ */ new Map();
function resolveStyleCss(style) {
  const name = style ?? "default";
  if (name.endsWith(".css")) {
    const cached = _styleCssCache.get(name);
    if (cached) return cached;
    const css = readFileSync(name, "utf-8");
    _styleCssCache.set(name, css);
    return css;
  }
  const cssPath = join(getStylesDir(), `${name}.css`);
  if (existsSync(cssPath)) {
    const cached = _styleCssCache.get(name);
    if (cached) return cached;
    const css = readFileSync(cssPath, "utf-8");
    _styleCssCache.set(name, css);
    return css;
  }
  throw new Error(
    `Unknown style "${name}". Built-in styles: ${getBuiltInStyles().join(", ")}. Or provide a path to a .css file.`
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
async function convertMarkdownToPdfBuffer(markdown, options) {
  const html = parseMarkdown(markdown);
  const title = options?.title ?? "Document";
  const fullHtml = wrapHtml(html, { title, style: options?.style });
  return generatePdf(fullHtml, {
    format: options?.format,
    landscape: options?.landscape,
    margin: options?.margin
  });
}

export { convertMarkdownToPdfBuffer, convertMdToPdf, generatePdf, generatePdfToFile, parseMarkdown, parseMarkdownFile, wrapHtml };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map