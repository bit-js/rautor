import Matcher from '../matcher';
import { test, expect } from 'bun:test';
import { generatePath, paths, pathsCount } from './paths';

const matcher = new Matcher<number>();
for (let i = 0; i < pathsCount; ++i) matcher.on(paths[i], i);

const match = matcher.compile();

for (let i = 0; i < pathsCount; ++i) {
  test(paths[i], () => {
    expect(match(generatePath(paths[i]), [])).toBe(i);
  });
}
