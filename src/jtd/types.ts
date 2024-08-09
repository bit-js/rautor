// JTD top level definition
export type UnknownInferredType = Record<string, any>;

// JTD type schema
export interface JTDTypeMap {
  boolean: boolean;

  string: string;
  timestamp: string;

  float32: number;
  float64: number;

  int: number;

  int8: number;
  uint8: number;

  int16: number;
  uint16: number;

  int32: number;
  uint32: number;
}

export interface JTDTypeSchema {
  type: keyof JTDTypeMap;
}

export type InferJTDTypeSchema<T extends JTDTypeSchema> = JTDTypeMap[T['type']];

// JTD enum
export interface JTDEnumSchema {
  enum: string[];
}

export type InferJTDEnumSchema<T extends JTDEnumSchema> = T['enum'][number];

// JTD elements schema
export interface JTDElementsSchema {
  elements: JTDSchema;
}

export type InferJTDElementsSchema<T extends JTDElementsSchema> = InferJTDSchema<T['elements']>[];

// JTD properties schema
export interface JTDPropertiesSchema {
  properties?: Record<string, JTDSchema>;
  optionalProperties?: Record<string, JTDSchema>;
  additionalProperties?: boolean;
}

export type InferJTDPropertiesSchema<T extends JTDPropertiesSchema> =
  (T['properties'] extends JTDSchemaRecord ? InferJTDSchemaRecord<T['properties']> : {})
  & (T['optionalProperties'] extends JTDSchemaRecord ? Partial<InferJTDSchemaRecord<T['optionalProperties']>> : {})
  & (T['additionalProperties'] extends true ? UnknownInferredType : {});

// JTD values schema
export interface JTDValuesSchema {
  values: JTDSchema;
}

export type InferJTDValuesSchema<T extends JTDValuesSchema> = Record<string, InferJTDSchema<T['values']>>;

// JTD discriminator schema
export interface JTDDiscriminatorSchema {
  discriminator: string;
  mapping: Record<string, JTDPropertiesSchema>;
}

export type InferJTDDiscriminatorSchema<T extends JTDDiscriminatorSchema> = {
  [K in keyof T['mapping']]: {
    [D in T['discriminator']]: K;
  } & InferJTDPropertiesSchema<T['mapping'][K]>
}[keyof T['mapping']];

// JTD ref
export interface JTDRef {
  ref: string;
}

declare const refSymbol: unique symbol;
type RefSymbol = typeof refSymbol;

export interface JTDRefRepresentation<T extends string = string> {
  [refSymbol]: T;
}

export type InferJTDRef<T, Defs> = T extends JTDRefRepresentation
  ? (T[RefSymbol] extends keyof Defs ? InferJTDRef<Defs[T[RefSymbol]], Defs> : unknown)
  : T extends UnknownInferredType
  ? { [K in keyof T]: InferJTDRef<T[K], Defs> }
  : T;

// Generic schema
export interface JTDCommonSchema {
  nullable?: boolean;
  metadata?: any;
}

export type JTDSchema = ({} | JTDTypeSchema | JTDElementsSchema | JTDPropertiesSchema | JTDValuesSchema | JTDDiscriminatorSchema | JTDRef) & JTDCommonSchema;
export type InferJTDSchema<T extends JTDSchema> = (
  T extends JTDTypeSchema ? InferJTDTypeSchema<T> :
  T extends JTDEnumSchema ? InferJTDEnumSchema<T> :
  T extends JTDElementsSchema ? InferJTDElementsSchema<T> :
  T extends JTDPropertiesSchema ? InferJTDPropertiesSchema<T> :
  T extends JTDValuesSchema ? InferJTDValuesSchema<T> :
  T extends JTDDiscriminatorSchema ? InferJTDDiscriminatorSchema<T> :
  T extends JTDRef ? JTDRefRepresentation<T['ref']> : unknown
) | (T['nullable'] extends true ? null : never);

// Generic schema record
export type JTDSchemaRecord = Record<string, JTDSchema>;
export type InferJTDSchemaRecord<T extends JTDSchemaRecord> = {
  [K in keyof T]: InferJTDSchema<T[K]>;
};

// Root JTD schema
export type RootJTDSchema = JTDSchema & { definitions?: JTDSchemaRecord };
export type InferRootJTDSchema<T extends RootJTDSchema> = T['definitions'] extends JTDSchemaRecord ? (
  InferJTDRef<InferJTDSchema<T>, InferJTDSchemaRecord<T['definitions']>>
) : InferJTDSchema<T>;
