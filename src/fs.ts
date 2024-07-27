import Matcher, { type MatchCallback } from './matcher';

export interface Options<T> {
  /**
   * Return the metadata associated to the path to match later
   *
   * This only run once while scanning to retrieve the metadata
   */
  on: (path: string) => T;

  /**
   * Can synchronously and return the paths as a string list or iterable
   */
  scan: (dir: string) => Iterable<string>;

  /**
   * Translate path to patterns
   */
  translate?: (path: string) => Iterable<string>;
}

// eslint-disable-next-line
const defaultTranslate: Options<any>['translate'] = (path: string) => [path.charCodeAt(0) === 47 ? path : '/' + path];

export default class FileSystemRouter<T> {
  public readonly options: Required<Options<T>>;

  public constructor(options: Options<T>) {
    options.translate ??= defaultTranslate;
    // @ts-expect-error All optional props have been assigned
    this.options = options;
  }

  /**
   * Return a callback for matching paths
   */
  public scan(dir: string): MatchCallback<T> {
    const matcher = new Matcher<T>();

    // Register paths
    const opts = this.options;

    const translate = opts.translate;
    const handle = opts.on;

    for (const path of opts.scan(dir)) for (const pattern of translate(path)) matcher.on(pattern, handle(path));

    // Return the compiled matcher
    return matcher.compile();
  }
}
