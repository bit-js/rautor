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

### Others

See more in [`rautor/src`](https://github.com/bit-js/rautor/tree/main/src)
