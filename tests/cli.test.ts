import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';

const execFileAsync = promisify(execFile);
const tsxPath = 'npx';
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

describe('CLI', () => {
  it('--help shows usage with md-to-pdf and [input]', async () => {
    const { stdout } = await execFileAsync(tsxPath, ['tsx', 'bin/md-to-pdf.ts', '--help']);
    expect(stdout).toContain('md-to-pdf');
    expect(stdout).toContain('[input]');
  });

  it('--version shows package.json version', async () => {
    const { stdout } = await execFileAsync(tsxPath, ['tsx', 'bin/md-to-pdf.ts', '--version']);
    expect(stdout.trim()).toBe(pkg.version);
  });

  it('--help shows --style option', async () => {
    const { stdout } = await execFileAsync(tsxPath, ['tsx', 'bin/md-to-pdf.ts', '--help']);
    expect(stdout).toContain('--style');
    expect(stdout).toContain('.css');
  });

  it('--help shows all CLI options', async () => {
    const { stdout } = await execFileAsync(tsxPath, ['tsx', 'bin/md-to-pdf.ts', '--help']);
    expect(stdout).toContain('--output');
    expect(stdout).toContain('--landscape');
    expect(stdout).toContain('--margin-top');
    expect(stdout).toContain('--format');
    expect(stdout).toContain('--list-styles');
  });

  it('--list-styles prints available styles', async () => {
    const { stdout } = await execFileAsync(tsxPath, ['tsx', 'bin/md-to-pdf.ts', '--list-styles']);
    expect(stdout).toContain('default');
    expect(stdout).toContain('eink');
    expect(stdout).toContain('elegant');
    expect(stdout).toContain('serif');
  });

  it('exits with error when no input is provided', async () => {
    try {
      await execFileAsync(tsxPath, ['tsx', 'bin/md-to-pdf.ts']);
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.stderr || err.stdout).toContain('missing required argument');
    }
  });
});
