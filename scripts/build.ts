/// <reference types='bun-types' />
import { existsSync, rmSync } from 'fs';
import { exec } from './utils';

const outdir = './lib';
if (existsSync(outdir)) rmSync(outdir, { recursive: true });

exec`bun x tsc --extendedDiagnostics`;

const transpiler = new Bun.Transpiler({
  loader: 'tsx',
  minifyWhitespace: true,
  treeShaking: true
});

for await (const path of new Bun.Glob('**/*.ts').scan('./src'))
  Bun.file(`./src/${path}`)
    .arrayBuffer()
    .then((buf) => transpiler.transform(buf).then((res) => res.length !== 0 ? Bun.write(`${outdir}/${path.slice(0, -2) + 'js'}`, res) : null));

