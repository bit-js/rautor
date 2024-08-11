import { compile_state_decls, compile_state_init, compile_state_result } from '../compiler';
import { method_trees_init, type MethodTrees } from '../method-trees';
import { request_matcher_compile } from '../request-matcher';
import { defaultNotFound } from './utils/constants';

export class App {
  public readonly trees: MethodTrees<any>;

  public constructor() {
    this.trees = method_trees_init();
  }

  public compile(): (req: Request) => any {
    const keys: string[] = [];
    const values: any[] = [];

    const state = compile_state_init((_item, _state, _isParam) => {
      // TODO
    }, keys, values);
    const builder = state[0];

    request_matcher_compile(this.trees, state);
    builder.push(`return ${state[2](defaultNotFound)};`);

    // eslint-disable-next-line
    return Function(...keys, `${compile_state_decls(state)}return (r)=>{${compile_state_result(state)}}`)(...values);
  }
}
