import { basename, dirname, join, resolve } from 'node:path';
import { parseMarkdown, parseMarkdownFile } from './parser.js';
import { wrapHtml } from './template.js';
import { generatePdf, generatePdfToFile } from './pdf.js';
import type { PdfOptions } from './pdf.js';

export { parseMarkdown, parseMarkdownFile } from './parser.js';
export { wrapHtml } from './template.js';
export { generatePdf, generatePdfToFile } from './pdf.js';
export type { PdfOptions } from './pdf.js';
export type { ParseOptions } from './parser.js';
export type { WrapHtmlOptions } from './template.js';

export interface ConvertOptions {
  output?: string;
  title?: string;
  style?: string;
  format?: PdfOptions['format'];
  landscape?: boolean;
  margin?: PdfOptions['margin'];
}

export async function convertMdToPdf(inputPath: string, options?: ConvertOptions): Promise<string> {
  const html = await parseMarkdownFile(inputPath);
  const filename = basename(inputPath, inputPath.endsWith('.markdown') ? '.markdown' : '.md');
  const title = options?.title ?? filename;
  const fullHtml = wrapHtml(html, { title, style: options?.style });
  const outputPath = options?.output ?? join(dirname(inputPath), `${filename}.pdf`);
  await generatePdfToFile(fullHtml, outputPath, {
    format: options?.format,
    landscape: options?.landscape,
    margin: options?.margin,
    basePath: resolve(dirname(inputPath)),
  });
  return outputPath;
}

export async function convertMarkdownToPdfBuffer(markdown: string, options?: ConvertOptions): Promise<Buffer> {
  const html = parseMarkdown(markdown);
  const title = options?.title ?? 'Document';
  const fullHtml = wrapHtml(html, { title, style: options?.style });
  return generatePdf(fullHtml, {
    format: options?.format,
    landscape: options?.landscape,
    margin: options?.margin,
  });
}
