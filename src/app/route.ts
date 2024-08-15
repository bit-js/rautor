import type { InferRootJTDSchema, RootJTDSchema } from '../jtd/types';
import type { GenericState, HandlerGroupData } from './handlers';
import type { Context } from './types/context';

import { isAsync } from './utils/constants';
import serializeValue from './utils/serializeValue';
import { chainProperty } from '../utils/identifier';
import { compile_state_derive, compile_state_sync, type AddValueCallback, type CompileState } from '../compiler';

// Route types
export type PlainRoute<State extends GenericState, Args extends any[]> = (...args: [...Args, Context & State]) => ConstructorParameters<typeof Response>[0];

export interface FormattedRoute<State extends GenericState, Args extends any[], Schemas extends Record<number, RootJTDSchema> | RootJTDSchema | undefined = undefined> {
  type: 'json';
  schema?: Schemas;
  fn: (...args: [...Args, Context & State]) => Schemas extends RootJTDSchema
    ? InferRootJTDSchema<Schemas>
    : Schemas extends Record<number, RootJTDSchema> ? { [K in Extract<keyof Schemas, number>]: InferRootJTDSchema<Schemas[K]> }[Extract<keyof Schemas, number>] : unknown;
}

export interface StaticRoute {
  type: 'static';
  body?: any;
  options?: Context;
}

export type Route<State extends GenericState, Args extends any[]> = PlainRoute<State, Args> | FormattedRoute<State, Args, any> | StaticRoute;

export type GenericRoute = Route<GenericState, []>;
export type RouteData = [handlers: HandlerGroupData[], route: unknown, errorHandlers: ErrorRoutesData];
export type ErrorRoutesData = Record<number, [route: GenericRoute, isDynamic: boolean]>;

// Compile route
type AppCompileState = [...CompileState<RouteData>, compiledGroups: WeakMap<HandlerGroupData, [result: string, requireAsync: boolean, notRequireContext: boolean]>, handlerIdx: number];

export function wrapRouteHandler(routeHandler: GenericRoute, addValue: AddValueCallback, previousNotRequireContext: boolean, arg: string): [string, notRequireContext: boolean] {
  if (typeof routeHandler === 'function') {
    const noFirstArg = arg.length === 0;
    // Last handler may still requires the context
    const notRequireContext = routeHandler.length === (noFirstArg ? 0 : 1);

    // Pass the return value to a Response object
    return [
      isAsync(routeHandler)
        ? notRequireContext
          ? `${addValue(routeHandler)}(${noFirstArg ? '' : arg}).then((o)=>new Response(o${previousNotRequireContext ? '' : ',c'}))`
          : `${addValue(routeHandler)}(${noFirstArg ? '' : `${arg},`}c).then((o)=>new Response(o,c))`
        : notRequireContext
          ? `new Response(${addValue(routeHandler)}(${noFirstArg ? '' : arg})${previousNotRequireContext ? '' : ',c'})`
          : `new Response(${addValue(routeHandler)}(${noFirstArg ? '' : `${arg},`}c),c)`,
      notRequireContext
    ];
  }

  const routeType = routeHandler.type;

  if (routeType === 'static') {
    // @ts-expect-error Options
    // eslint-disable-next-line
    const res = new Response(serializeValue(routeHandler.body), routeHandler.options);
    return [`return ${addValue(res)}${res.body === null ? '' : '.clone()'};`, true];
  }

  // TODO: JSON
  return ['', true];
}

export function compileRouteData(item: RouteData, state: CompileState<RouteData>, isParam: boolean): void {
  // States for optimizations
  let isHandlerAsync = false;
  let noContext = true;

  // Quick access
  const builder = state[0];
  const addValue = state[2];

  // Compile and cache handler groups
  const handlerGroups = item[0];
  const handlerErrorHandlers = item[2];
  // @ts-expect-error Compiler hack
  const compiledGroups = (state as AppCompileState)[5];

  for (let i = handlerGroups.length - 1; i > -1; i--) {
    const handlers = handlerGroups[i];
    const compileResult = compiledGroups.get(handlers);

    if (typeof compileResult === 'undefined') {
      // Compile all handlers
      let isGroupAsync = false;
      let groupHasNoContext = true;

      // Create an independent compile state for a group
      const groupCompileState = compile_state_derive(state);
      const groupResultBuilder = groupCompileState[0];

      for (let j = 0, len = handlers.length; j < len; j++) {
        // Quick access
        const handlerData = handlers[i];
        const handlerType = handlerData[0];
        const handler = handlerData[1];

        if (handlerType === 0) {
          // Check if the current handler is an async function
          if (handlerData[2]) {
            isGroupAsync = true;

            if (!isHandlerAsync) {
              // Wrap the code with an async scope
              builder.push('return (async ()=>{');
              isHandlerAsync = true;
            }
          }

          // Check if the current handler requires an arg
          if (handlerData[3]) {
            groupHasNoContext = false;

            if (noContext) {
              builder.push(`const c={status:200,headers:[]${isParam ? ',params:a' : ''}};`);
              noContext = false;
            }
          }

          // @ts-expect-error pass in the derived state
          handler(groupCompileState);
        } else {
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

          // Check if the current handler requires an arg
          const notRequireContext = handler.length === 0;
          if (!notRequireContext) {
            groupHasNoContext = false;

            if (noContext) {
              builder.push(`const c={status:200,headers:[]${isParam ? ',params:a' : ''}};`);
              noContext = false;
            }
          }

          // Get handler call part
          const handlerCall = `${isCurrentHandlerAsync ? 'await ' : ''}${addValue(handler)}(${notRequireContext ? '' : 'c'});`;

          // @ts-expect-error Compiler hack to track result id
          const curId = (state as AppCompileState)[6];

          if (handlerType === 1) {
            groupResultBuilder.push(`const x${curId}=${handlerCall}${compileErrorHandlers(handlerErrorHandlers, addValue, noContext, `x${curId}`)}`);
            // @ts-expect-error Compiler hack
            (state as AppCompileState)[6]++;
          } else if (handlerType === 2)
            groupResultBuilder.push(handlerCall);
          else if (handlerType === 3) {
            groupResultBuilder.push(`const x${curId}=${handlerCall}${compileErrorHandlers(handlerErrorHandlers, addValue, noContext, `x${curId}`)}${chainProperty('c', handlerData[2])}=x${curId};`);
            // @ts-expect-error Compiler hack
            (state as AppCompileState)[6]++;
          } else
            groupResultBuilder.push(`${chainProperty('c', handlerData[2])}=${handlerCall}`);
        }
      }

      // Push to current string builder and cache the result
      const groupResult = groupResultBuilder.join('');
      builder.push(groupResult);
      compiledGroups.set(handlers, [groupResult, isGroupAsync, groupHasNoContext]);

      // Must sync the state of the original to the group state
      compile_state_sync(state, groupCompileState);
    } else {
      if (compileResult[1] && !isHandlerAsync) {
        // Wrap the code with an async scope
        builder.push('return (async ()=>{');
        isHandlerAsync = true;
      }

      // Create a context if necessary
      if (compileResult[2] && noContext) {
        builder.push(`const c={status:200,headers:[]${isParam ? ',params:a' : ''}};`);
        noContext = false;
      }

      builder.push(compileResult[0]);
    }
  }

  // Compile route handler
  const compiledResult = wrapRouteHandler(item[1] as GenericRoute, addValue, noContext, '');
  if (!compiledResult[1] && noContext) {
    builder.push(`const c={status:200,headers:[]${isParam ? ',params:a' : ''}};`);
    noContext = false;
  }

  builder.push('return ', compiledResult[0], ';');

  // Close the async scope
  if (isHandlerAsync) builder.push('})();');
}

export function compileErrorHandlers(routeHandlers: ErrorRoutesData, addValue: AddValueCallback, previousNotRequireContext: boolean, resultSymbol: string): string {
  const keys = Object.keys(routeHandlers);
  const keyLen = keys.length;

  // No error handler
  if (keyLen === 0)
    return `if(Array.isArray(${resultSymbol})&&${resultSymbol}[0]===eS)`;

  const payload = `${resultSymbol}[2]`;

  // Compile only one error handler
  if (keyLen === 1) {
    const key = keys[0] as unknown as number;
    const routeData = routeHandlers[key];
    const compiledResult = wrapRouteHandler(routeData[0], addValue, previousNotRequireContext, routeData[1] ? payload : '');
    return `if(Array.isArray(${resultSymbol})&&${resultSymbol}[0]===eS){${compiledResult[1] ? '' : 'const c={status:200,headers:[]};'}return ${resultSymbol}[1]===${key}?${compiledResult[0]}:sE;}`;
  }

  // Compile multiple error handlers
  const builder: string[] = [`if(Array.isArray(${resultSymbol})&&${resultSymbol}[0]===eS)switch(${resultSymbol}[1]){`];

  for (let i = 0; i < keyLen; ++i) {
    const key = keys[i] as unknown as number;
    const routeData = routeHandlers[key];
    const compiledResult = wrapRouteHandler(routeData[0], addValue, previousNotRequireContext, routeData[1] ? payload : '');
    builder.push(compiledResult[1] ? `case ${key}:return ${compiledResult[0]};` : `case ${key}:{const c={status:200,headers:[]};return ${compiledResult[0]};}`);
  }

  builder.push('default:return sE;}');
  return builder.join('');
}
