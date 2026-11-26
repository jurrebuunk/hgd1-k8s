import { mkdtemp, mkdir, copyFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const staging = await mkdtemp(join(tmpdir(), 'buunk-theme-'));
const login = join(staging, 'flatwork/login');
await mkdir(join(login, 'resources/css'), { recursive: true });
await mkdir(join(login, 'resources/js'), { recursive: true });
await mkdir(join(login, 'resources/img'), { recursive: true });
await mkdir(join(login, 'resources/fonts'), { recursive: true });
await mkdir(join(login, 'messages'), { recursive: true });
for (const file of ['theme.properties', 'template.ftl', 'login.ftl', 'login-otp.ftl', 'login-reset-password.ftl', 'info.ftl', 'binary.ftl']) {
  await copyFile(join(root, file), join(login, file));
}
for (const lang of ['en', 'nl']) await copyFile(join(root, `messages_${lang}.properties`), join(login, `messages/messages_${lang}.properties`));
for (const file of ['flatwork.css', 'auth.css']) await copyFile(join(root, file), join(login, 'resources/css', file));
await copyFile(join(root, 'auth.js'), join(login, 'resources/js/auth.js'));
await copyFile(join(root, 'favicon.svg'), join(login, 'resources/img/favicon.svg'));
for (const font of ['geist-400', 'geist-500', 'geist-600', 'plex-mono-400']) await copyFile(join(root, `${font}.woff2`), join(login, `resources/fonts/${font}.woff2`));
// The email theme is hand-written: copied as it is.
await cp(join(root, 'email'), join(staging, 'flatwork/email'), { recursive: true });
const child = spawn('docker', ['run', '--rm', '--name', 'buunk-theme-preview',
  '--network', 'host',
  '-v', `${staging}/flatwork:/opt/keycloak/themes/flatwork:ro`,
  '-v', `${root}/tests/realm.json:/opt/keycloak/data/import/realm.json:ro`,
  'quay.io/keycloak/keycloak:26.8.2', 'start-dev', '--import-realm', '--http-host=127.0.0.1', '--http-port=18080',
  '--spi-theme--static-max-age=-1', '--spi-theme--cache-themes=false', '--spi-theme--cache-templates=false',
], { stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', async code => { await rm(staging, { recursive: true, force: true }); process.exitCode = code ?? 1; });
