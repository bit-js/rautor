# Rautor

A small, fast, compile-only URL router.

## Modules

### Matcher

Example usage:

```ts
import Matcher from "@bit-js/rautor/matcher";

const matcher = new Matcher<string>();

matcher.on("/", "Hi");
matcher.on("/*", "Hello");

// Compile the matcher
const match = matcher.compile();

const r0 = match("/", []);
r0; // 'Hi'

const params = []; // A list to hold params
const r1 = match("/reve", params);

params; // ['reve']
r1; // 'Hello'

const r2 = match("/not-found", []);
r2; // null
```

## FS router

Example usage in Node:

```ts
import { createRouter } from "@bit-js/rautor/fs";
import { readdirSync } from "fs";

const route = createRouter({
  // A function to retrieve the metadata from a path
  // Only run in scanning
  on: (path) => new Response(path),

  // Scan the directory and return file paths as an iterator or array
  // You should cache the option object
  scan: (dir) => readdirSync(dir, { recursive: true }),
});

// Compile a new matcher (usage like above)
const match = route("src");
match("/", []); // Response | null
```

Router options include:

```ts
export interface Options<T> {
  /**
   * Return the metadata associated to the path to match later
   *
   * This only run once while scanning
   */
  on: (path: string) => T;

  /**
   * Scan synchronously and return the paths as a string list or iterable
   */
  scan: (dir: string) => Iterable<string>;

  /**
   * Return a list of patterns that will resolve to the path
   *
   * By default the path will be prefixed with slash if it doesn't, eg. `index.ts` -> `/index.ts`
   */
  translate?: (path: string) => Iterable<string>;
}
```

### Others

See more in [`rautor/src`](https://github.com/bit-js/rautor/tree/main/src)
