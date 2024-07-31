// JTD top level definition
export type UnknownInferredType = Record<string, unknown>;

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

export type InferJTDElementsSchema<T extends JTDElementsSchema, Defs extends UnknownInferredType> = InferJTDSchema<T['elements'], Defs>[];

// JTD properties schema
export interface JTDPropertiesSchema {
  properties?: Record<string, JTDSchema>;
  optionalProperties?: Record<string, JTDSchema>;
  additionalProperties?: boolean;
}

export type InferJTDPropertiesSchema<T extends JTDPropertiesSchema, Defs extends UnknownInferredType> =
  (T['properties'] extends JTDSchemaRecord ? InferJTDSchemaRecord<T['properties'], Defs> : {})
  & (T['optionalProperties'] extends JTDSchemaRecord ? Partial<InferJTDSchemaRecord<T['optionalProperties'], Defs>> : {})
  & (T['additionalProperties'] extends true ? UnknownInferredType : {});

// JTD values schema
export interface JTDValuesSchema {
  values: JTDSchema;
}

export type InferJTDValuesSchema<T extends JTDValuesSchema, Defs extends UnknownInferredType> = Record<string, InferJTDSchema<T['values'], Defs>>;

// JTD discriminator schema
export interface JTDDiscriminatorSchema {
  discriminator: string;
  mapping: Record<string, JTDPropertiesSchema>;
}

export type InferJTDDiscriminatorSchema<T extends JTDDiscriminatorSchema, Defs extends UnknownInferredType> = {
  [K in keyof T['mapping']]: {
    [D in T['discriminator']]: K;
  } & InferJTDPropertiesSchema<T['mapping'][K], Defs>
};

// JTD ref
export interface JTDRef {
  ref: string;
}

export type InferJTDRef<T extends JTDRef, Defs extends UnknownInferredType> = T['ref'] extends keyof Defs ? Defs[T['ref']] : any;

// Generic schema
export interface JTDCommonSchema {
  nullable?: boolean;
  metadata?: any;
}

export type JTDSchema = ({} | JTDTypeSchema | JTDElementsSchema | JTDPropertiesSchema | JTDValuesSchema | JTDDiscriminatorSchema) & JTDCommonSchema;
export type InferJTDSchema<T extends JTDSchema, Defs extends UnknownInferredType> = (
  T extends JTDTypeSchema ? InferJTDTypeSchema<T> :
  T extends JTDEnumSchema ? InferJTDEnumSchema<T> :
  T extends JTDElementsSchema ? InferJTDElementsSchema<T, Defs> :
  T extends JTDPropertiesSchema ? InferJTDPropertiesSchema<T, Defs> :
  T extends JTDValuesSchema ? InferJTDValuesSchema<T, Defs> :
  T extends JTDDiscriminatorSchema ? InferJTDDiscriminatorSchema<T, Defs> :
  T extends JTDRef ? InferJTDRef<T, Defs> : any
) | (T['nullable'] extends true ? null : never);

// Generic schema record
export type JTDSchemaRecord = Record<string, JTDSchema>;
export type InferJTDSchemaRecord<T extends JTDSchemaRecord, Defs extends UnknownInferredType> = {
  [K in keyof T]: InferJTDSchema<T[K], Defs>;
};

// Root JTD schema
export type RootJTDSchema = JTDSchema & { definitions?: JTDSchemaRecord };
export type InferRootJTDSchema<T extends RootJTDSchema> = InferJTDSchema<T, T['definitions'] extends JTDSchemaRecord ? InferJTDSchemaRecord<T['definitions'], {}> : {}>;
