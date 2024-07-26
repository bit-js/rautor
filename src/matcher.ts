import { tree_compile, type CompileCallback } from './compiler';
import { tree_init, tree_register, type Tree } from './tree';

// eslint-disable-next-line
const compile: CompileCallback<any> = (item, addValue) => addValue(item);

export class Matcher<T> {
  public readonly tree: Tree<T>;

  public constructor() {
    this.tree = tree_init();
  }

  public on(path: string, store: T): void {
    tree_register(this.tree, path, store);
  }

  public compile(): (path: string, params: string[]) => T | null {
    const output = tree_compile(this.tree, compile);
    // eslint-disable-next-line
    return Function(...output[1], `return (p,a)=>{const l=p.length;${output[0].join('')};return null;}`)(...output[2]);
  }
}
