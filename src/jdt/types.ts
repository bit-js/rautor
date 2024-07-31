// JDT top level definition
export type UnknownInferredType = Record<string, unknown>;

// JDT type schema
export interface JDTTypeMap {
  boolean: boolean;

  string: string;
  timestamp: string;

  float32: number;
  float64: number;

  int8: number;
  uint8: number;

  int16: number;
  uint16: number;

  int32: number;
  uint32: number;
}

export interface JDTTypeSchema {
  type: keyof JDTTypeMap;
}

export type InferJDTTypeSchema<T extends JDTTypeSchema> = JDTTypeMap[T['type']];

// JDT enum
export interface JDTEnumSchema {
  enum: string[];
}

export type InferJDTEnumSchema<T extends JDTEnumSchema> = T['enum'][number];

// JDT elements schema
export interface JDTElementsSchema {
  elements: JDTSchema;
}

export type InferJDTElementsSchema<T extends JDTElementsSchema, Defs extends UnknownInferredType> = InferJDTSchema<T['elements'], Defs>[];

// JDT properties schema
export interface JDTPropertiesSchema {
  properties?: Record<string, JDTSchema>;
  optionalProperties?: Record<string, JDTSchema>;
  additionalProperties?: boolean;
}

export type InferJDTPropertiesSchema<T extends JDTPropertiesSchema, Defs extends UnknownInferredType> =
  (T['properties'] extends JDTSchemaRecord ? InferJDTSchemaRecord<T['properties'], Defs> : {})
  & (T['optionalProperties'] extends JDTSchemaRecord ? Partial<InferJDTSchemaRecord<T['optionalProperties'], Defs>> : {})
  & (T['additionalProperties'] extends true ? UnknownInferredType : {});

// JDT values schema
export interface JDTValuesSchema {
  values: JDTSchema;
}

export type InferJDTValuesSchema<T extends JDTValuesSchema, Defs extends UnknownInferredType> = Record<string, InferJDTSchema<T['values'], Defs>>;

// JDT discriminator schema
export interface JDTDiscriminatorSchema {
  discriminator: string;
  mapping: Record<string, JDTPropertiesSchema>;
}

export type InferJDTDiscriminatorSchema<T extends JDTDiscriminatorSchema, Defs extends UnknownInferredType> = {
  [K in keyof T['mapping']]: {
    [D in T['discriminator']]: K;
  } & InferJDTPropertiesSchema<T['mapping'][K], Defs>
};

// JDT ref
export interface JDTRef<T extends UnknownInferredType = any> {
  ref: keyof T;
}

export type InferJDTRef<T extends JDTRef, Defs extends UnknownInferredType> = T['ref'] extends keyof Defs ? Defs[T['ref']] : any;

// Generic schema
export interface JDTCommonSchema {
  nullable?: boolean;
  metadata?: any;
}

export type JDTSchema = ({} | JDTTypeSchema | JDTElementsSchema | JDTPropertiesSchema | JDTValuesSchema | JDTDiscriminatorSchema) & JDTCommonSchema;
export type InferJDTSchema<T extends JDTSchema, Defs extends UnknownInferredType> = (
  T extends JDTTypeSchema ? InferJDTTypeSchema<T> :
    T extends JDTEnumSchema ? InferJDTEnumSchema<T> :
      T extends JDTElementsSchema ? InferJDTElementsSchema<T, Defs> :
        T extends JDTPropertiesSchema ? InferJDTPropertiesSchema<T, Defs> :
          T extends JDTValuesSchema ? InferJDTValuesSchema<T, Defs> :
            T extends JDTDiscriminatorSchema ? InferJDTDiscriminatorSchema<T, Defs> :
              T extends JDTRef ? InferJDTRef<T, Defs> : any
) | (T['nullable'] extends true ? null : never);

// Generic schema record
export type JDTSchemaRecord = Record<string, JDTSchema>;
export type InferJDTSchemaRecord<T extends JDTSchemaRecord, Defs extends UnknownInferredType> = {
  [K in keyof T]: InferJDTSchema<T[K], Defs>;
};

// Root JDT schema
export type RootJDTSchema = JDTSchema & { definition?: JDTSchemaRecord };
export type InferRootJDTSchema<T extends RootJDTSchema> = InferJDTSchema<T, T['definition'] extends JDTSchemaRecord ? InferJDTSchemaRecord<T['definition'], {}> : {}>;
