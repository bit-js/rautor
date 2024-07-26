/// <reference types='bun-types' />
import { existsSync, rmSync } from 'fs';
import { exec } from './utils';

const outdir = './lib';
if (existsSync(outdir)) rmSync(outdir, { recursive: true });

const transpiler = new Bun.Transpiler();

for await (const path of new Bun.Glob('**/*.ts').scan('./src'))
  Bun.file(`./src/${path}`)
    .arrayBuffer()
    .then((buf) => transpiler.transform(buf).then((res) => Bun.write(`${outdir}/${path}`, res)));

await exec`bun x tsc`;
