import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveStyleCss, CSS, getBuiltInStyles } from '../src/styles.js';

describe('resolveStyleCss', () => {
  it('returns default CSS when style is undefined', () => {
    expect(resolveStyleCss()).toBe(CSS);
  });

  it('returns default CSS when style is "default"', () => {
    expect(resolveStyleCss('default')).toBe(CSS);
  });

  it('returns markdown1 CSS with light background', () => {
    const css = resolveStyleCss('markdown1');
    expect(css).toContain('background:#fefefe');
    expect(css).not.toBe(CSS);
  });

  it('returns markdown2 CSS with Vollkorn font', () => {
    const css = resolveStyleCss('markdown2');
    expect(css).toContain('Vollkorn');
    expect(css).not.toBe(CSS);
  });

  it('resolves any .css file in the styles directory by name', () => {
    const css = resolveStyleCss('serif');
    expect(css).toBeTruthy();
    expect(css).not.toBe(CSS);
  });

  it('reads a custom .css file path', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'md-to-pdf-styles-'));
    const cssPath = join(tmpDir, 'my-theme.css');
    writeFileSync(cssPath, 'body { font-size: 42px; }');
    try {
      const css = resolveStyleCss(cssPath);
      expect(css).toBe('body { font-size: 42px; }');
    } finally {
      rmSync(tmpDir, { recursive: true });
    }
  });

  it('throws for a non-existent .css file path', () => {
    expect(() => resolveStyleCss('/tmp/does-not-exist-12345.css')).toThrow('ENOENT');
  });

  it('throws for an unknown style name', () => {
    expect(() => resolveStyleCss('fancy')).toThrow(/Unknown style "fancy"/);
  });

  it('error message lists built-in styles', () => {
    expect(() => resolveStyleCss('fancy')).toThrow(/default/);
  });
});

describe('getBuiltInStyles', () => {
  it('includes default and all .css files from styles directory', () => {
    const styles = getBuiltInStyles();
    expect(styles).toContain('default');
    expect(styles).toContain('markdown1');
    expect(styles).toContain('markdown2');
    expect(styles).toContain('markdown9');
    expect(styles).toContain('serif');
  });

  it('does not include .css extension in style names', () => {
    const styles = getBuiltInStyles();
    expect(styles.every(s => !s.endsWith('.css'))).toBe(true);
  });
});
