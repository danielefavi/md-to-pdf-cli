#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { convertMdToPdf } from '../src/index.js';
import { getBuiltInStyles } from '../src/styles.js';

declare const PKG_VERSION: string;

function getVersion(): string {
  if (typeof PKG_VERSION !== 'undefined') return PKG_VERSION;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));
  return pkg.version;
}

const program = new Command();

program
  .name('md-to-pdf')
  .description('Convert Markdown files to styled PDF documents')
  .version(getVersion())
  .argument('[input]', 'Markdown file to convert')
  .option('-o, --output <path>', 'Output PDF file path')
  .option('-t, --title <title>', 'Document title')
  .option('-f, --format <format>', 'Page format (A4, Letter, Legal)', 'A4')
  .option('--landscape', 'Use landscape orientation')
  .option('--margin-top <margin>', 'Top margin (e.g. 20mm)')
  .option('--margin-right <margin>', 'Right margin (e.g. 20mm)')
  .option('--margin-bottom <margin>', 'Bottom margin (e.g. 20mm)')
  .option('--margin-left <margin>', 'Left margin (e.g. 20mm)')
  .option('-s, --style <name-or-path>', `Style name (${getBuiltInStyles().join(', ')}) or path to .css file`)
  .option('-l, --list-styles', 'List available styles')
  .action(async (input: string | undefined, opts: Record<string, string | boolean | undefined>) => {
    try {
      if (opts.listStyles) {
        console.log('Available styles:\n');
        for (const style of getBuiltInStyles()) {
          console.log(`  ${style}`);
        }
        process.exit(0);
      }

      if (!input) {
        program.error('missing required argument: input');
        return;
      }
      const margin = (opts.marginTop || opts.marginRight || opts.marginBottom || opts.marginLeft)
        ? {
            top: (opts.marginTop as string | undefined) ?? '20mm',
            right: (opts.marginRight as string | undefined) ?? '20mm',
            bottom: (opts.marginBottom as string | undefined) ?? '20mm',
            left: (opts.marginLeft as string | undefined) ?? '20mm',
          }
        : undefined;

      const outputPath = await convertMdToPdf(input, {
        output: opts.output as string | undefined,
        title: opts.title as string | undefined,
        style: opts.style as string | undefined,
        format: opts.format as 'A4' | 'Letter' | 'Legal' | undefined,
        landscape: opts.landscape as boolean | undefined,
        margin,
      });
      console.log(`PDF saved to ${outputPath}`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  });

program.parse();
