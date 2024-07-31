import type { CompileState } from '../compiler';
import type { JTDElementsSchema, JTDEnumSchema, JTDRef, JTDSchema, JTDTypeSchema, RootJTDSchema } from './types';

export type JTDCompileRefsMap = Record<string, number> | null;

// eslint-disable-next-line
export function jtd_json_assert_compile(schema: RootJTDSchema, paramName: string, state: CompileState<any>): void {
  if (typeof schema.definitions === 'undefined')
    jtd_json_assert_compile_conditions(schema, paramName, state[0], null);
  else {
    const defs = schema.definitions;
    const refs: JTDCompileRefsMap = {};

    // Pre-define for reference later
    for (const key in defs) {
      const fnID = state[4]++;
      refs[key] = fnID;
    }

    // Actually build the declarations
    const declsBuilder = state[3];

    for (const key in defs) {
      declsBuilder.push(`const d${refs[key]}=(o)=>`);
      jtd_json_assert_compile_conditions(defs[key], 'o', declsBuilder, refs);
      declsBuilder.push(';');
    }

    jtd_json_assert_compile_conditions(schema, paramName, state[0], refs);
  }
}

// eslint-disable-next-line
export function jtd_json_assert_compile_conditions(schema: JTDSchema, paramName: string, builder: string[], refs: JTDCompileRefsMap): void {
  for (const key in schema) {
    if (key === 'type') {
      const isNullable = schema.nullable === true;
      if (isNullable) builder.push(`(${paramName}===null||`);

      // Checking type
      const specifiedType = (schema as JTDTypeSchema).type;

      builder.push(specifiedType === 'string'
        ? `typeof ${paramName}==='string'`
        : specifiedType === 'boolean'
          ? `typeof ${paramName}==='boolean'`
          : specifiedType === 'float32' || specifiedType === 'float64'
            ? `typeof ${paramName}==='number'`
            : specifiedType === 'int'
              ? `Number.isInteger(${paramName})`
              : specifiedType === 'int8'
                ? `Number.isInteger(${paramName})&&${paramName}>-129&&${paramName}<128`
                : specifiedType === 'uint8'
                  ? `Number.isInteger(${paramName})&&${paramName}>-1&&${paramName}<256`
                  : specifiedType === 'int16'
                    ? `Number.isInteger(${paramName})&&${paramName}>-32769&&${paramName}<32768`
                    : specifiedType === 'uint16'
                      ? `Number.isInteger(${paramName})&&${paramName}>-1&&${paramName}<65536`
                      : specifiedType === 'int32'
                        ? `Number.isInteger(${paramName})&&${paramName}>-2147483649&&${paramName}<2147483648`
                        : specifiedType === 'uint32'
                          ? `Number.isInteger(${paramName})&&${paramName}>-1&&${paramName}<4294967296`
                          : `!Number.isNaN(Date.parse(${paramName}))`);

      if (isNullable) builder.push(')');
      return;
    } else if (key === 'ref') {
      // Call the assert function if it exists, else ignore everything
      if (refs !== null) {
        const id = refs[(schema as JTDRef).ref];
        if (typeof id === 'number')
          builder.push(schema.nullable === true ? `(${paramName}===null||d${id}(${paramName}))` : `d${id}(${paramName})`);
      }

      return;
    } else if (key === 'elements') {
      const isNullable = schema.nullable === true;
      if (isNullable) builder.push(`(${paramName}===null||`);

      builder.push(`Array.isArray(${paramName})&&${paramName}.every((o)=>`);
      jtd_json_assert_compile_conditions((schema as JTDElementsSchema).elements, 'o', builder, refs);
      builder.push(')');

      if (isNullable) builder.push(')');
      return;
    } else if (key === 'enum') {
      builder.push('(');

      if (schema.nullable === true) builder.push(`${paramName}===null`);
      for (let i = 0, arr = (schema as JTDEnumSchema).enum, l = arr.length; i < l; ++i) builder.push(`${paramName}===${JSON.stringify(arr[i])}`);

      builder.push(')');
      return;
    }
  }
}
