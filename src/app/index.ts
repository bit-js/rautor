import { compile_state_init, compile_state_decls, compile_state_result, type CompileState, compile_state_init_with_add_value_cb } from '../compiler';
import { method_trees_init, type MethodTrees } from '../method-trees';
import { request_matcher_compile } from '../request-matcher';
import { chainProperty } from '../utils/identifier';

import type { GenericState, HandlerGroupData } from './handlers';
import type { RouteData } from './route';
import { isAsync } from './utils/constants';
import serializeValue from './utils/serializeValue';

type AppCompileState = [...CompileState<RouteData>, compiledGroups: WeakMap<HandlerGroupData, [requireAsync: boolean, result: string]>, handlerIdx: number];

function compileRoute(item: RouteData, state: CompileState<RouteData>, isParam: boolean): void {
  let isHandlerAsync = false;

  const builder = state[0];
  const addValue = state[2];
  builder.push(`const c={status:200,headers:[]${isParam ? ',params:a' : ''}};`);

  // Compile and cache handler groups
  const handlerGroups = item[0];
  // @ts-expect-error Compiler hack
  const compiledGroups = (state as AppCompileState)[5];

  for (let i = handlerGroups.length - 1; i > -1; i--) {
    const handlers = handlerGroups[i];
    const compileResult = compiledGroups.get(handlers);

    if (typeof compileResult === 'undefined') {
      // Compile all handlers
      let isGroupAsync = false;

      // Create an independent compile state for a group
      // @ts-expect-error Disable compile callback for sub-state
      const groupCompileState = compile_state_init_with_add_value_cb(null, addValue);
      const groupResultBuilder = groupCompileState[0];

      for (let j = 0, len = handlers.length; j < len; j++) {
        const handlerData = handlers[i];
        const handlerType = handlerData[0];
        const handler = handlerData[1];

        if (handlerType === 0)
          handler(groupCompileState);
        else {
          // Check if the current handler is an async function
          const isCurrentHandlerAsync = isAsync(handler);
          if (isCurrentHandlerAsync) {
            isGroupAsync = true;

            if (!isHandlerAsync) {
              // Wrap the code with an async scope
              builder.push('return (async ()=>{');
              isHandlerAsync = true;
            }
          }

          isGroupAsync ||= isCurrentHandlerAsync;

          // @ts-expect-error Compiler hack to track result id
          const curId = (state as AppCompileState)[6];

          if (handlerType === 1)
            groupResultBuilder.push(`const x${curId}=${isCurrentHandlerAsync ? 'await ' : ''}${addValue(handler)}(${handler.length === 0 ? '' : 'c'});if(x${curId} instanceof Response)return x${curId};`);
          else if (handlerType === 2)
            groupResultBuilder.push(`${isCurrentHandlerAsync ? 'await ' : ''}${addValue(handler)}(${handler.length === 0 ? '' : 'c'});`);
          else if (handlerType === 3)
            groupResultBuilder.push(`const x${curId}=${isCurrentHandlerAsync ? 'await ' : ''}${addValue(handler)}(${handler.length === 0 ? '' : 'c'});if(x${curId} instanceof Response)return x${curId};${chainProperty('c', handlerData[2])}=x${curId};`);
          else
            groupResultBuilder.push(`${chainProperty('c', handlerData[2])}=${isCurrentHandlerAsync ? 'await ' : ''}${addValue(handler)}(${handler.length === 0 ? '' : 'c'});`);

          // @ts-expect-error Compiler hack
          (state as AppCompileState)[6]++;
        }
      }

      const groupResult = groupResultBuilder.join('');

      // Push to current string builder and cache the result
      builder.push(groupResult);
      compiledGroups.set(handlers, [isGroupAsync, groupResult]);
    } else {
      if (compileResult[0] && !isHandlerAsync) {
        // Wrap the code with an async scope
        builder.push('return (async ()=>{');
        isHandlerAsync = true;
      }

      builder.push(compileResult[1]);
    }
  }

  // Compile route handler
  const routeHandler = item[1];
  if (typeof routeHandler === 'function') {
    builder.push(isAsync(routeHandler)
      ? `return ${addValue(routeHandler)}(${routeHandler.length === 0 ? '' : 'c'}).then((o)=>new Response(o,c));`
      : `return new Response( ${addValue(routeHandler)}(${routeHandler.length === 0 ? '' : 'c'}),c);`);
  } else {
    // Special route type
    const routeType = routeHandler.type;

    if (routeType === 'static') {
      // @ts-expect-error Options
      // eslint-disable-next-line
      const res = new Response(serializeValue(routeHandler.body), routeHandler.options);
      builder.push(`return ${addValue(res)}${res.body === null ? '' : '.clone()'};`);
    }

    // TODO: JSON
  }

  // Close the async scope
  if (isHandlerAsync) builder.push('})();');
}

export class App<State extends GenericState> {
  public readonly trees: MethodTrees<RouteData>;

  public constructor() {
    this.trees = method_trees_init();
  }

  // x[id] is the handler result
  // c is the request context
  // nF is the default not found response
  // sE is the default server error response
  // nO is a function that returns null
  // p is the path
  // a is the params
  // l is the path length
  // e is the path end
  // u is the full url
  // m is the method
  // r is the request object
  public compile(): (req: Request) => any {
    // Inject dependencies
    const keys: string[] = [];
    const values: any[] = [];

    // Compile state
    const state = compile_state_init(compileRoute, keys, values);
    // @ts-expect-error Compiler hack to include other states in the compile state
    state.push(new WeakMap(), 0);

    // Fallback response
    request_matcher_compile(this.trees, state);
    // eslint-disable-next-line
    return Function(...keys, `const nF=new Response(null,{status:404}),sE=new Response(null,{status:500});${compile_state_decls(state)}return (r)=>{${compile_state_result(state)}return nF;}`)(...values);
  }
}
