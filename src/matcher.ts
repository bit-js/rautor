import { tree_compile, type CompileCallback } from './compiler';
import { tree_init, tree_register, type Tree } from './tree';

// eslint-disable-next-line
const compile: CompileCallback<any> = (item, addValue) => addValue(item);

export type MatchCallback<T> = (path: string, params: string[]) => T | null;

export default class Matcher<T> {
  public readonly tree: Tree<T>;

  public constructor() {
    this.tree = tree_init();
  }

  public on(path: string, store: T): void {
    tree_register(this.tree, path, store);
  }

  public compile(): MatchCallback<T> {
    const tree = this.tree;
    const output = tree_compile(tree, compile);

    // eslint-disable-next-line
    const fn = Function(...output[1], `return (p,a)=>{const l=p.length;${output[0][0].join('')};return null;}`)(...output[2]) as MatchCallback<T>;
    console.log(fn.toString());
    if (tree[1] === null) return fn;

    const staticMatcher = tree[1];
    return (path, params) => staticMatcher[path] ?? fn(path, params);
  }
}
