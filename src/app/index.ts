import { compile_state_create_add_value_cb, compile_state_decls, compile_state_init_with_add_value_cb, compile_state_result, type AddValueCallback } from '../compiler';
import { method_trees_init, type MethodTrees } from '../method-trees';
import { request_matcher_compile } from '../request-matcher';

import { errorSymbol, type GenericError } from '../error';

import type { ErrorHandler, GenericState } from './handlers';
import type { GenericRoute } from './route';

export class App<State extends GenericState> {
  public readonly trees: MethodTrees<GenericRoute>;
  public readonly errorHandlers: Record<number, [hasPayload: boolean, handler: any]>;

  public constructor() {
    this.trees = method_trees_init();
    this.errorHandlers = {};
  }

  /**
   * Register an error handler
   */
  public catch<const ErrorType extends GenericError, const Handler extends ErrorHandler<GenericError, State>>(errorType: ErrorType, handler: Handler): this {
    // errorType is an array if error is static
    this.errorHandlers[errorType[1]] = [!Array.isArray(errorType), handler];
    return this as any;
  }

  private compileErrorHandlerCases(addValue: AddValueCallback): string {
    const errBuilder = ['{'];
    const handlers = this.errorHandlers;

    for (const key in handlers) {
      const handler = handlers[key];
      errBuilder.push(`case ${key}:return ${addValue(handler)};`);
    }

    errBuilder.push('default:return sE;}');
    return errBuilder.join('');
  }

  // c is the request context
  // nF is the default not found response
  // sE is the default server error response
  // nO is a function that returns null
  public compile(): (req: Request) => any {
    // Inject dependencies
    const keys: string[] = [];
    const values: any[] = [];
    const addValue = compile_state_create_add_value_cb(keys, values);

    // Pre-compile the error handlers
    const errorCases = this.compileErrorHandlerCases(addValue);
    const errorSymbolId = addValue(errorSymbol);

    // Compile state
    const state = compile_state_init_with_add_value_cb((item, state, isParam) => {
      // TODO
    }, addValue);

    // Fallback response
    request_matcher_compile(this.trees, state);
    // eslint-disable-next-line
    return Function(...keys, `const nF=new Response(null,{status:404}),sE=new Response(null,{status:500}),;${compile_state_decls(state)}return (r)=>{${compile_state_result(state)}return nF;}`)(...values);
  }
}
