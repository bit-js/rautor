import { compile_state_init, compile_state_decls, compile_state_result } from '../compiler';
import { method_trees_init, type MethodTrees } from '../method-trees';
import { request_matcher_compile } from '../request-matcher';

import type { GenericState, HandlerGroupData } from './handlers';
import type { RouteData } from './route';

export class App<State extends GenericState> {
  public readonly trees: MethodTrees<RouteData>;

  public constructor() {
    this.trees = method_trees_init();
  }

  // c is the request context
  // nF is the default not found response
  // sE is the default server error response
  // nO is a function that returns null
  public compile(): (req: Request) => any {
    // Inject dependencies
    const keys: string[] = [];
    const values: any[] = [];

    const compiledGroup = new WeakMap<HandlerGroupData, [requireAsync: boolean, result: string]>();

    // Compile state
    const state = compile_state_init<RouteData>((item, state, isParam) => {
      let isHandlerAsync = false;

      const builder = state[0];
      const addValue = state[2];

      builder.push(`const c={status:200,headers:[]${isParam ? ',params:a' : ''}};`);

      // Compile and cache handler groups
      const handlerGroups = item[0];
      for (let i = handlerGroups.length - 1; i > -1; i--) {
        const handlers = handlerGroups[i];

        const compileResult = compiledGroup.get(handlers);
        if (typeof compileResult === 'undefined') {
        } else {
          if (compileResult[0] && !isHandlerAsync) {
            builder.push('return (async ()=>{');
            isHandlerAsync = true;
          }

          builder.push(compileResult[1]);
        }
      }

      if (isHandlerAsync) builder.push('})();');
    }, keys, values);

    // Fallback response
    request_matcher_compile(this.trees, state);
    // eslint-disable-next-line
    return Function(...keys, `const nF=new Response(null,{status:404}),sE=new Response(null,{status:500});${compile_state_decls(state)}return (r)=>{${compile_state_result(state)}return nF;}`)(...values);
  }
}
