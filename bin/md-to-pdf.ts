#!/usr/bin/env node

import { Command } from 'commander';
import { convertMdToPdf } from '../src/index.js';
import { getBuiltInStyles } from '../src/styles.js';

const program = new Command();

program
  .name('md-to-pdf')
  .description('Convert Markdown files to styled PDF documents')
  .version('0.1.0')
  .argument('<input>', 'Markdown file to convert')
  .option('-o, --output <path>', 'Output PDF file path')
  .option('-t, --title <title>', 'Document title')
  .option('-f, --format <format>', 'Page format (A4, Letter, Legal)', 'A4')
  .option('--landscape', 'Use landscape orientation')
  .option('--margin-top <margin>', 'Top margin (e.g. 20mm)')
  .option('--margin-right <margin>', 'Right margin (e.g. 20mm)')
  .option('--margin-bottom <margin>', 'Bottom margin (e.g. 20mm)')
  .option('--margin-left <margin>', 'Left margin (e.g. 20mm)')
  .option('-s, --style <name-or-path>', `Style name (${getBuiltInStyles().join(', ')}) or path to .css file`)
  .action(async (input: string, opts: Record<string, string | boolean | undefined>) => {
    try {
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
