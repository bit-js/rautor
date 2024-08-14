import type { CompileState } from '../compiler';
import type { Context } from './types/context';

export type GenericState = Record<string, any>;

export type Handler<State extends GenericState> = (ctx: Context & State) => unknown;
export type SpecialHandler<FirstArg, State extends GenericState> = (x: FirstArg, ctx: Context & State) => unknown;
export type GenericHandler = Handler<GenericState>;

// Store route handlers data
export type Injector = [0, (state: CompileState<any>) => void, requireAsync: boolean, requireContext: boolean];
export type Middleware<State extends GenericState> = [1, Handler<State>];
export type NoExceptMiddleware<State extends GenericState> = [2, Handler<State>];
export type Setter<State extends GenericState> = [3, Handler<State>, name: string];
export type NoExceptSetter<State extends GenericState> = [4, Handler<State>, name: string];

export type GenericHandlerData = Injector
  | Middleware<GenericState> | NoExceptMiddleware<GenericState>
  | Setter<GenericState> | NoExceptSetter<GenericState>;

export type HandlerGroupData = GenericHandlerData[];
