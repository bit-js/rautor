import Matcher, { type MatchCallback } from './matcher';

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

export function createRouter<T>(options: Options<T>): (dir: string) => MatchCallback<T> {
  return (dir) => {
    const matcher = new Matcher<T>();

    // Register paths
    const translate = options.translate;
    const handle = options.on;

    // eslint-disable-next-line
    if (typeof translate === 'undefined') for (const path of options.scan(dir)) matcher.on(path.charCodeAt(0) === 47 ? path : '/' + path, handle(path));
    else for (const path of options.scan(dir)) for (const pattern of translate(path)) matcher.on(pattern, handle(path));

    // Return the compiled matcher
    return matcher.compile();
  };
}
