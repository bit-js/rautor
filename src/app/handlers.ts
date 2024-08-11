import type { CompileState } from '../compiler';
import type { Context } from './types/context';

export type GenericState = Record<string, any>;

export type Injector = [0, (state: CompileState<any>) => void];
export type Middleware<State extends GenericState> = [1, (ctx: Context & State) => unknown];
export type NoExceptMiddleware<State extends GenericState> = [2, Middleware<State>[1]];
export type Setter<State extends GenericState> = [3, Middleware<State>[1]];
export type NoExceptSetter<State extends GenericState> = [4, Setter<State>[1]];

export type GenericHandler = Injector
  | Middleware<GenericState> | NoExceptMiddleware<GenericState>
  | Setter<GenericState> | NoExceptSetter<GenericState>;

