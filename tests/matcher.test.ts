import Matcher from '../src/matcher';
import { test, expect } from 'bun:test';
import { generatePath, paths, pathsCount } from '../datasets/paths';

const matcher = new Matcher<number>();
for (let i = 0; i < pathsCount; ++i) matcher.on(paths[i], i);

const match = matcher.compile();
console.log(match.toString());

for (let i = 0; i < pathsCount; ++i) {
  test(paths[i], () => {
    expect(match(generatePath(paths[i]))?.[0]).toBe(i);
  });
}
