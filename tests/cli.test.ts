import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';

const execFileAsync = promisify(execFile);
const tsxPath = 'npx';
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

describe('CLI', () => {
  it('--help shows usage with md-to-pdf and <input>', async () => {
    const { stdout } = await execFileAsync(tsxPath, ['tsx', 'bin/md-to-pdf.ts', '--help']);
    expect(stdout).toContain('md-to-pdf');
    expect(stdout).toContain('<input>');
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
});
