import { compile_state_init, type AddValueCallback, type CompileState } from '../compiler';
import { chainProperty } from '../utils/identifier';
import type { InferRootJTDSchema, JTDElementsSchema, JTDEnumSchema, JTDPropertiesSchema, JTDRef, JTDSchema, JTDTypeSchema, JTDValuesSchema, RootJTDSchema } from './types';

export type JTDCompileRefsMap = Record<string, number> | null;
export type JTDCompileState = [builder: string[], addValue: AddValueCallback, refs: JTDCompileRefsMap];

// eslint-disable-next-line
export function jtd_json_assert_compile(schema: RootJTDSchema, paramName: string, state: CompileState<any>): void {
  if (typeof schema.definitions === 'undefined') {
    const builder = state[0];
    const prevBuilderLength = builder.length;
    jtd_json_assert_compile_conditions(schema, paramName, [builder, state[2], null]);
    if (prevBuilderLength === builder.length)
      builder.push('true');
  } else {
    const defs = schema.definitions;
    const refs: JTDCompileRefsMap = {};

    // Pre-define for reference later
    for (const key in defs) {
      const fnID = state[4]++;
      refs[key] = fnID;
    }

    // Actually build the declarations
    const declsBuilder = state[3];
    const compileState: JTDCompileState = [declsBuilder, state[2], refs];

    for (const key in defs) {
      declsBuilder.push(`const d${refs[key]}=(o)=>`);

      const prevBuilderLength = declsBuilder.length;
      jtd_json_assert_compile_conditions(defs[key], 'o', compileState);
      if (prevBuilderLength === declsBuilder.length)
        declsBuilder.push('true');

      declsBuilder.push(';');
    }

    // Change target builder
    const builder = compileState[0] = state[0];
    const prevBuilderLength = builder.length;
    jtd_json_assert_compile_conditions(schema, paramName, compileState);
    if (prevBuilderLength === builder.length)
      declsBuilder.push('true');
  }
}

// eslint-disable-next-line
export function jtd_json_assert_compile_conditions(schema: JTDSchema, paramName: string, state: JTDCompileState): void {
  const builder = state[0];
  const isNullable = schema.nullable === true;

  let hasObjectCondition = false;

  for (const key in schema) {
    if (key === 'properties') {
      if (!hasObjectCondition) {
        builder.push(isNullable ? `(${paramName}===null||typeof ${paramName}==='object'` : `typeof ${paramName}==='object'&&${paramName}!==null`);
        hasObjectCondition = true;
      }

      // eslint-disable-next-line
      const props = (schema as JTDPropertiesSchema).properties!;
      for (const propKey in props) {
        builder.push('&&');

        const builderPrevLen = builder.length;
        jtd_json_assert_compile_conditions(props[propKey], chainProperty(paramName, propKey), state);
        // Handle any schema
        if (builder.length === builderPrevLen)
          builder.push(`${JSON.stringify(propKey)} in ${paramName}`);
      }
    } else if (key === 'optionalProperties') {
      if (!hasObjectCondition) {
        builder.push(isNullable ? `(${paramName}===null||typeof ${paramName}==='object'` : `typeof ${paramName}==='object'&&${paramName}!==null`);
        hasObjectCondition = true;
      }

      // eslint-disable-next-line
      const props = (schema as JTDPropertiesSchema).optionalProperties!;
      for (const propKey in props) {
        builder.push(`&&(!(${JSON.stringify(propKey)} in ${paramName})||`);

        const builderPrevLen = builder.length;
        jtd_json_assert_compile_conditions(props[propKey], chainProperty(paramName, propKey), state);
        // Handle any schema
        builder.push(builder.length === builderPrevLen ? 'true)' : ')');
      }
    } else if (key === 'additionalProperties') {
      if ((schema as JTDPropertiesSchema).additionalProperties === false) {
        if (!hasObjectCondition) {
          builder.push(isNullable ? `(${paramName}===null||typeof ${paramName}==='object'` : `typeof ${paramName}==='object'&&${paramName}!==null`);
          hasObjectCondition = true;
        }

        if (typeof (schema as JTDPropertiesSchema).optionalProperties === 'undefined')
          // eslint-disable-next-line
          builder.push(`&&Object.keys(${paramName}).length===${typeof (schema as JTDPropertiesSchema).properties === 'undefined' ? 0 : Object.keys((schema as JTDPropertiesSchema).properties!).length}`);
        else {
          const obj: Dict<null> = {};
          for (const propKey in (schema as JTDPropertiesSchema).optionalProperties) obj[propKey] = null;
          if (typeof (schema as JTDPropertiesSchema).properties !== 'undefined')
            for (const propKey in (schema as JTDPropertiesSchema).properties) obj[propKey] = null;

          builder.push(`&&Object.keys(${paramName}).every(${state[1]((propKey: string) => obj[propKey] === null)})`);
        }
      }
    } else if (key === 'type') {
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
      if (state[2] !== null) {
        const id = state[2][(schema as JTDRef).ref];
        if (typeof id === 'number')
          builder.push(schema.nullable === true ? `(${paramName}===null||d${id}(${paramName}))` : `d${id}(${paramName})`);
      }

      return;
    } else if (key === 'elements') {
      if (isNullable) builder.push(`(${paramName}===null||`);

      builder.push(`Array.isArray(${paramName})&&${paramName}.every((o)=>`);

      const prevBuilderLength = builder.length;
      jtd_json_assert_compile_conditions((schema as JTDElementsSchema).elements, 'o', state);
      if (prevBuilderLength === builder.length)
        builder.push('true');

      builder.push(')');

      if (isNullable) builder.push(')');
      return;
    } else if (key === 'enum') {
      // Inject a key map to quickly check the values
      const keyMap: Record<string, null> = {};
      for (let i = 0, arr = (schema as JTDEnumSchema).enum, l = arr.length; i < l; ++i) keyMap[arr[i]] = null;
      const keyMapId = state[1](keyMap);

      if (isNullable) builder.push(`(${paramName}===null||`);

      builder.push(`${keyMapId}[${paramName}]===null`);

      if (isNullable) builder.push(')');
      return;
    } else if (key === 'values') {
      if (isNullable) builder.push(`(${paramName}===null||`);

      builder.push(`typeof ${paramName}==='object'&&${paramName}!==null&&Object.values(${paramName}).every((o)=>`);
      jtd_json_assert_compile_conditions((schema as JTDValuesSchema).values, 'o', state);
      builder.push(')');

      if (isNullable) builder.push(')');
      return;
    }
  }

  if (hasObjectCondition && isNullable) builder.push(')');
}

// eslint-disable-next-line
export function jdt_json_create_assert_func<T extends RootJTDSchema>(schema: T): (o: any) => o is InferRootJTDSchema<T> {
  const keys: string[] = [];
  const values: any[] = [];
  // @ts-expect-error Disable compileCallback
  const state = compile_state_init(null, keys, values);
  jtd_json_assert_compile(schema, 'o', state);
  // eslint-disable-next-line
  return Function(...keys, `${state[3].join('')}return (o)=>${state[0].join('')}`)(...values);
}
