import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const tsxPath = 'npx';

describe('CLI', () => {
  it('--help shows usage with md-to-pdf and <input>', async () => {
    const { stdout } = await execFileAsync(tsxPath, ['tsx', 'bin/md-to-pdf.ts', '--help']);
    expect(stdout).toContain('md-to-pdf');
    expect(stdout).toContain('<input>');
  });

  it('--version shows 0.1.0', async () => {
    const { stdout } = await execFileAsync(tsxPath, ['tsx', 'bin/md-to-pdf.ts', '--version']);
    expect(stdout.trim()).toBe('0.1.0');
  });

  it('--help shows --style option', async () => {
    const { stdout } = await execFileAsync(tsxPath, ['tsx', 'bin/md-to-pdf.ts', '--help']);
    expect(stdout).toContain('--style');
    expect(stdout).toContain('.css');
  });
});
