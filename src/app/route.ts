import type { InferRootJTDSchema, RootJTDSchema } from '../jtd/types';
import type { GenericState } from './handlers';
import type { Context } from './types/context';

// Route types
export type PlainRoute<State extends GenericState> = (ctx: Context & State) => ConstructorParameters<typeof Response>[0];

export interface FormattedRoute<State extends GenericState, Schemas extends Record<number, RootJTDSchema> | RootJTDSchema | undefined = undefined> {
  response: 'json' | 'raw';
  schema?: Schemas;
  fn: (ctx: Context & State) => Schemas extends RootJTDSchema
    ? InferRootJTDSchema<Schemas>
    : Schemas extends Record<number, RootJTDSchema>
      ? { [K in Extract<keyof Schemas, number>]: InferRootJTDSchema<Schemas[K]> }[Extract<keyof Schemas, number>]
      : unknown;
}

export type Route<State extends GenericState> = PlainRoute<State> | FormattedRoute<State, any> | Response;

