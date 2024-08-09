import type { Context } from './types/context';

export type PlainRoute<State extends Record<string, any>> = (c: Context & State) => ConstructorParameters<typeof Response>[0];
