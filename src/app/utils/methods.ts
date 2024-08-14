export type LowercaseMethods = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'trace';
export type MethodProto = Record<LowercaseMethods, any>;
