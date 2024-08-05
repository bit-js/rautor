# Rautor

A small, fast compiler stack for web frameworks.

## Patterns

Rautor supports URL parameters and wildcards.

To capture the value of a path part, use the `*` character.

```ts
"/id/*"; // Capture the value of the part after '/id/' (value does not including slash)
"/id/*/dashboard"; // Capture the value of the part between '/id/' and '/dashboard'
```

To match all parts after a segment, use `**` at the end of the pattern.

```ts
"/id/**"; // Capture everything after '/id/'
```

Captured parameters will be stored in an array.

## Modules

### Matcher

Example usage:

```ts
import Matcher from "rautor/matcher";

const matcher = new Matcher<string>();

matcher.on("/", "Hi");
matcher.on("/*", "Hello");

// Compile the matcher
const match = matcher.compile();

const r0 = match("/");
r0; // ['Hi', []]

const r1 = match("/reve");
r1; // ['Hello', ['reve']];

const r2 = match("/not-found");
r2; // null
```

### FS router

Example usage in Node:

```ts
import { createRouter } from "rautor/fs";
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

### Compiler stack

This guide will go through the process of building a simple server API with the compiler stack.

To start, import the `request-matcher` and the `compiler` module:

```ts
import {
  request_matcher_init,
  request_matcher_register,
  request_matcher_register_all,
  request_matcher_compile
  type RequestMatcher,
} from "rautor/request-matcher";

import {
  compile_state_init,
  compile_state_result,
  type CompileCallback
} from "rautor/compiler";
```

Let's define our handler type and the compile callback function to inline our handler:

```ts
type Handler = (req: Request, params: string[]) => Response;

// Special variables in the scope:
// p is the parsed request path
// a is the params
// l is the path length
// s is the path start
// e is the path end
// u is the full url
// m is the method
// r is the request object
const compileCb: CompileCallback<Handler> = (item, state, hasParam) => {
  const builder = state[0]; // The string builder
  const injectValue = state[2]; // The callback to inject a value to the output function scope and return the injected key name

  const argsCount = item.length;

  // If there's no args then pass nothing in
  // If there's one arg or this route does not have parameters then pass in the request
  // Else pass in the request with params
  builder.push(
    // Add a statement that returns the result of the function call
    `return ${injectValue(item)}(${argsCount === 0 ? "" : argsCount === 1 || !hasParam ? "r" : "r,a"})`,
  );
};
```

Then create a simple `App` class:

```ts
export class App {
  public readonly requestMatcher: RequestMatcher<Handler>;

  public constructor() {
    this.requestMatcher = request_matcher_init<Handler>();
  }

  /**
   * Register a handler
   */
  public register(method: string, path: string, handler: Handler) {
    request_matcher_register(this.requestMatcher, method, path, handler);
  }

  /**
   * Register a handler
   */
  public all(path: string, handler: Handler) {
    request_matcher_register_all(this.requestMatcher, path, handler);
  }

  /**
   * Build and return the fetch function
   */
  public build(): (req: Request) => any {
    const keys: string[] = [];
    const values: any[] = [];

    const state = compile_state_init<Handler>(compileCb, keys, values);
    request_matcher_compile(this.requestMatcher, state);

    // We need to feed r as a Request object
    return Function(
      ...keys,
      `const fallback=new Response(null,{status:404});${compile_state_decls(state)}return (r)=>{${compile_state_result(state)};return fallback;}`,
    )(...values);
  }
}
```

The last line in `build()` does the following things:

- Create a function which accepts arguments with names listed in `keys`.
- That function returns a request handler function.
- Call the created function with the parameters listed in `values`, we get the final request handler function.

The `injectValue` callback in `state` was to add the corresponding key and value to the lists.

Example usage:

```ts
const app = new App();

app.register("GET", "/", (req) => new Response("Hi"));
app.all("/*", () => new Response("Hello"));

const fetch = app.build();
```

### Others

You can see other modules in [`rautor/src`](https://github.com/bit-js/rautor/tree/main/src).
