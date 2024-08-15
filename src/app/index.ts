import { compile_state_init, compile_state_decls, compile_state_result } from '../compiler';
import { errorSymbol, type StaticError, type DynamicError } from '../error';
import { method_trees_init, method_trees_register, type MethodTrees } from '../method-trees';
import { request_matcher_compile } from '../request-matcher';

import type { GenericState, HandlerGroupData, Injector, Middleware, Setter } from './handlers';
import { compileRouteData, type ErrorRoutesData, type Route, type RouteData } from './route';
import type { MethodProto } from './utils/methods';

export class App<State extends GenericState> implements MethodProto {
  public readonly trees: MethodTrees<RouteData>;
  public readonly handlers: HandlerGroupData;
  public readonly errorHandlers: ErrorRoutesData;

  public constructor() {
    this.trees = method_trees_init();
    this.handlers = [];
    this.errorHandlers = [];
  }

  /**
   * Handle a static error
   */
  public catch<const ErrorHandler extends Route<State, []>>(err: StaticError, fn: ErrorHandler): this;

  /**
   * Handle a static error
   */
  public catch<const ErrorType extends DynamicError<any>, const ErrorHandler extends Route<State, [ErrorType['payloadInfer']]>>(err: ErrorType, fn: ErrorHandler): this;

  /** @internal */
  public catch(err: StaticError | DynamicError<any>, fn: any): this {
    const isStaticError = Array.isArray(err);
    this.errorHandlers[isStaticError ? err[1] : err.id] = [fn, !isStaticError];
    return this;
  }

  /**
   * Inject code to the handle process
   */
  public inject(fn: Injector[1], options?: { requireContext?: boolean, requireAsync?: boolean }): this {
    this.handlers.push(typeof options === 'undefined' ? [0, fn, false, false] : [0, fn, options.requireAsync === true, options.requireContext === true]);
    return this;
  }

  /**
   * Bind a key-value pair to the context on every request
   */
  public use<Handler extends Middleware<State>[1]>(fn: Handler, noexcept?: boolean): this {
    this.handlers.push([noexcept === true ? 2 : 1, fn as any]);
    return this;
  }

  /**
   * Bind a key-value pair to the context on every request
   */
  public set<const Key extends string, Handler extends Setter<State>[1]>(key: Key, fn: Handler, noexcept?: boolean): this {
    this.handlers.push([noexcept === true ? 4 : 3, fn as any, key]);
    return this;
  }

  /**
   * Register a GET method handler for a path
   */
  public get<const Path extends string, const RouteHandler extends Route<State, []>>(path: Path, route: RouteHandler): this {
    method_trees_register(this.trees, 'GET', path, [[this.handlers], route, this.errorHandlers]);
    return this;
  }

  // x[id] is the handler result
  // c is the request context
  // nF is the default not found response
  // sE is the default server error response
  // eS is the error symbol
  // p is the path
  // a is the params
  // l is the path length
  // e is the path end
  // u is the full url
  // m is the method
  // r is the request object
  public compile(): (req: Request) => any {
    // Inject dependencies
    const keys: string[] = ['eS'];
    const values: any[] = [errorSymbol];

    // Compile state
    const state = compile_state_init(compileRouteData, keys, values);
    // @ts-expect-error Compiler hack to include other states in the compile state
    state.push(new WeakMap(), 0);

    // Fallback response
    request_matcher_compile(this.trees, state);

    // eslint-disable-next-line
    return Function(...keys, `const nF=new Response(null,{status:404}),sE=new Response(null,{status:500});${compile_state_decls(state)}return (r)=>{${compile_state_result(state)}return nF;}`)(...values);
  }
}
