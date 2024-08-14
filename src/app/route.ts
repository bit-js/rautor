import type { InferRootJTDSchema, RootJTDSchema } from '../jtd/types';
import type { GenericState, HandlerGroupData } from './handlers';
import type { Context } from './types/context';

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
export type RouteData = [handlers: HandlerGroupData[], route: GenericRoute];

