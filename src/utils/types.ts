export type AwaitedReturn<T> = T extends (...args: any[]) => any ? Awaited<ReturnType<T>> : never;
