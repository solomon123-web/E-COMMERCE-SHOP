import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('server env config', () => {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const serverRoot = path.resolve(__dirname, '..');
  const originalCwd = process.cwd();
  const originalPaystackKey = process.env.PAYSTACK_SECRET_KEY;

  afterEach(() => {
    process.chdir(originalCwd);
    if (originalPaystackKey === undefined) {
      delete process.env.PAYSTACK_SECRET_KEY;
    } else {
      process.env.PAYSTACK_SECRET_KEY = originalPaystackKey;
    }
    vi.resetModules();
  });

  it('loads PAYSTACK_SECRET_KEY from server/.env even when run from project root', async () => {
    const envFile = path.join(serverRoot, '.env');
    const previousContents = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
    fs.writeFileSync(envFile, 'PAYSTACK_SECRET_KEY=server_env_secret\n', 'utf8');

    process.env.PAYSTACK_SECRET_KEY = '';
    process.chdir(projectRoot);

    const moduleUrl = pathToFileURL(path.join(serverRoot, 'src/config/env.ts')).href + `?v=${Date.now()}`;
    const { env } = await import(moduleUrl);

    expect(env.paystackSecretKey).toBe('server_env_secret');

    fs.writeFileSync(envFile, previousContents, 'utf8');
  });
});
