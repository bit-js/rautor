import { compile_state_init, compile_state_result, type CompileCallback } from './compiler';
import { tree_compile, tree_init, tree_register, type Tree } from './tree';

// eslint-disable-next-line
const compile: CompileCallback<any> = (item, state, isParam) => {
  state[0].push(isParam ? `return [${state[2](item)},a];` : `return [${state[2](item)},[]];`);
};

export type MatchCallback<T> = (path: string) => [T, string[]] | null;

/**
 * Basic path matcher
 */
export default class Matcher<T> {
  public readonly tree: Tree<T>;

  public constructor() {
    this.tree = tree_init();
  }

  public on(path: string, store: T): void {
    tree_register(this.tree, path, store);
  }

  public compile(): MatchCallback<T> {
    const keys: string[] = [];
    const values: any[] = [];
    const state = compile_state_init(compile, keys, values);

    const tree = this.tree;
    tree_compile(tree, state);
    // eslint-disable-next-line
    return Function(...keys, `return (p)=>{${compile_state_result(state)};return null;}`)(...values) as MatchCallback<T>;
  }
}
