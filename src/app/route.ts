import type { InferRootJTDSchema, RootJTDSchema } from '../jtd/types';
import type { GenericState, HandlerGroupData } from './handlers';
import type { Context } from './types/context';

import { isAsync } from './utils/constants';
import serializeValue from './utils/serializeValue';
import { chainProperty } from '../utils/identifier';
import { compile_state_derive, compile_state_sync, type CompileState } from '../compiler';

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
export type RouteData = [handlers: HandlerGroupData[], route: unknown];

// Compile route
type AppCompileState = [...CompileState<RouteData>, compiledGroups: WeakMap<HandlerGroupData, [result: string, requireAsync: boolean, notRequireContext: boolean]>, handlerIdx: number];

export function compileRoute(item: RouteData, state: CompileState<RouteData>, isParam: boolean): void {
  // States for optimizations
  let isHandlerAsync = false;
  let noContext = true;

  // Quick access
  const builder = state[0];
  const addValue = state[2];

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

          if (handlerType === 1)
            groupResultBuilder.push(`const x${curId}=${handlerCall}if(x${curId} instanceof Response)return x${curId};`);
          else if (handlerType === 2)
            groupResultBuilder.push(handlerCall);
          else if (handlerType === 3)
            groupResultBuilder.push(`const x${curId}=${handlerCall}if(x${curId} instanceof Response)return x${curId};${chainProperty('c', handlerData[2])}=x${curId};`);
          else
            groupResultBuilder.push(`${chainProperty('c', handlerData[2])}=${handlerCall}`);

          // @ts-expect-error Compiler hack
          (state as AppCompileState)[6]++;
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
  const routeHandler = item[1] as GenericRoute;
  if (typeof routeHandler === 'function') {
    // Last handler may still requires the context
    const notRequireContext = routeHandler.length === 0;
    if (!notRequireContext && noContext) {
      builder.push(`const c={status:200,headers:[]${isParam ? ',params:a' : ''}};`);
      noContext = false;
    }

    // Pass the return value to a Response object
    builder.push(isAsync(routeHandler)
      ? notRequireContext
        ? `return ${addValue(routeHandler)}().then((o)=>new Response(o${noContext ? '' : ',c'}));`
        : `return ${addValue(routeHandler)}(c).then((o)=>new Response(o,c));`
      : notRequireContext
        ? `return new Response(${addValue(routeHandler)}()${noContext ? '' : ',c'});`
        : `return new Response(${addValue(routeHandler)}(c),c);`);

    // Must be after to track whether context has been created before
    noContext &&= notRequireContext;
  } else {
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
