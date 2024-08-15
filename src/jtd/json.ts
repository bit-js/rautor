import { compile_state_init, type CompileState } from '../compiler';
import { chainProperty } from '../utils/identifier';
import type { InferRootJTDSchema, JTDDiscriminatorSchema, JTDElementsSchema, JTDEnumSchema, JTDPropertiesSchema, JTDRef, JTDSchema, JTDTypeSchema, JTDValuesSchema, RootJTDSchema } from './types';

export type JTDCompileRefsMap = Record<string, number> | null;
export type JTDCompileState = [builder: string[], refs: JTDCompileRefsMap];

// eslint-disable-next-line
export function jtd_json_assert_compile(schema: RootJTDSchema, paramName: string, state: CompileState<any>): void {
  if (typeof schema.definitions === 'undefined') {
    const builder = state[0];
    const prevBuilderLength = builder.length;
    jtd_json_assert_compile_conditions(schema, paramName, [builder, null], false);
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
    const compileState: JTDCompileState = [declsBuilder, refs];

    for (const key in defs) {
      declsBuilder.push(`const d${refs[key]}=(o)=>`);

      const prevBuilderLength = declsBuilder.length;
      jtd_json_assert_compile_conditions(defs[key], 'o', compileState, false);
      if (prevBuilderLength === declsBuilder.length)
        declsBuilder.push('true');

      declsBuilder.push(';');
    }

    // Change target builder
    const builder = compileState[0] = state[0];
    const prevBuilderLength = builder.length;
    jtd_json_assert_compile_conditions(schema, paramName, compileState, false);
    if (prevBuilderLength === builder.length)
      declsBuilder.push('true');
  }
}

// eslint-disable-next-line
export function jtd_json_assert_compile_conditions(schema: JTDSchema, paramName: string, state: JTDCompileState, ignoreObjectCheck: boolean): void {
  const builder = state[0];
  const isNullable = schema.nullable === true;

  let hasObjectCondition = false;

  for (const key in schema) {
    if (key === 'properties') {
      if (!hasObjectCondition && !ignoreObjectCheck) {
        builder.push(isNullable ? `(${paramName}===null||typeof ${paramName}==='object'` : `typeof ${paramName}==='object'&&${paramName}!==null`);
        hasObjectCondition = true;
      }

      // eslint-disable-next-line
      const props = (schema as JTDPropertiesSchema).properties!;
      for (const propKey in props) {
        builder.push('&&');

        const builderPrevLen = builder.length;
        jtd_json_assert_compile_conditions(props[propKey], chainProperty(paramName, propKey), state, false);
        // Handle any schema
        if (builder.length === builderPrevLen)
          builder.push(`${JSON.stringify(propKey)} in ${paramName}`);
      }
    } else if (key === 'optionalProperties') {
      if (!hasObjectCondition && !ignoreObjectCheck) {
        builder.push(isNullable ? `(${paramName}===null||typeof ${paramName}==='object'` : `typeof ${paramName}==='object'&&${paramName}!==null`);
        hasObjectCondition = true;
      }

      // eslint-disable-next-line
      const props = (schema as JTDPropertiesSchema).optionalProperties!;
      for (const propKey in props) {
        builder.push(`&&(!(${JSON.stringify(propKey)} in ${paramName})||`);

        const builderPrevLen = builder.length;
        jtd_json_assert_compile_conditions(props[propKey], chainProperty(paramName, propKey), state, false);
        // Handle any schema
        builder.push(builder.length === builderPrevLen ? 'true)' : ')');
      }
    } else if (key === 'additionalProperties') {
      if ((schema as JTDPropertiesSchema).additionalProperties === false) {
        if (!hasObjectCondition && !ignoreObjectCheck) {
          builder.push(isNullable ? `(${paramName}===null||typeof ${paramName}==='object'` : `typeof ${paramName}==='object'&&${paramName}!==null`);
          hasObjectCondition = true;
        }

        if (typeof (schema as JTDPropertiesSchema).optionalProperties === 'undefined')
          // eslint-disable-next-line
          builder.push(`&&Object.keys(${paramName}).length===${typeof (schema as JTDPropertiesSchema).properties === 'undefined' ? 0 : Object.keys((schema as JTDPropertiesSchema).properties!).length}`);
        else {
          // eslint-disable-next-line
          builder.push(`&&Object.keys(${paramName}).every((o)=>${Object.keys((schema as JTDPropertiesSchema).optionalProperties!).map((item) => `o===${JSON.stringify(item)}`).join('||')}${typeof (schema as JTDPropertiesSchema).properties !== 'undefined' ? '' : Object.keys((schema as JTDPropertiesSchema).properties!).map((item) => `||o===${JSON.stringify(item)}`).join('')})`);
        }
      }
    } else if (key === 'discriminator') {
      if (isNullable) builder.push(`(${paramName}===null||typeof ${paramName}==='object'&&`);
      else builder.push(`typeof ${paramName}==='object'&&${paramName}!==null&&`);

      // Object compilation results always output with prefix &&
      const discriminatorProp = chainProperty(paramName, (schema as JTDDiscriminatorSchema).discriminator);

      const discriminatorMapEntries = Object.entries((schema as JTDDiscriminatorSchema).mapping);
      const lastIdx = discriminatorMapEntries.length - 1;

      for (let i = 0; i < lastIdx; ++i) {
        const entry = discriminatorMapEntries[i];
        builder.push(`${discriminatorProp}===${JSON.stringify(entry[0])}?true`);

        const builderPrevLen = builder.length;
        jtd_json_assert_compile_conditions(entry[1], paramName, state, true);
        builder.push(builder.length === builderPrevLen ? '&&true:' : ':');
      }

      const lastEntry = discriminatorMapEntries[lastIdx];
      builder.push(`${discriminatorProp}===${JSON.stringify(lastEntry[0])}`);

      const builderPrevLen = builder.length;
      jtd_json_assert_compile_conditions(lastEntry[1], paramName, state, true);
      if (builder.length === builderPrevLen)
        builder.push('&&true');

      if (isNullable) builder.push(')');
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
      if (state[1] !== null) {
        const id = state[1][(schema as JTDRef).ref];
        if (typeof id === 'number')
          builder.push(schema.nullable === true ? `(${paramName}===null||d${id}(${paramName}))` : `d${id}(${paramName})`);
      }

      return;
    } else if (key === 'elements') {
      if (isNullable) builder.push(`(${paramName}===null||`);

      builder.push(`Array.isArray(${paramName})&&${paramName}.every((o)=>`);

      const prevBuilderLength = builder.length;
      jtd_json_assert_compile_conditions((schema as JTDElementsSchema).elements, 'o', state, false);
      if (prevBuilderLength === builder.length)
        builder.push('true');

      builder.push(')');

      if (isNullable) builder.push(')');
      return;
    } else if (key === 'enum') {
      if (isNullable) builder.push(`(${paramName}===null||`);
      builder.push((schema as JTDEnumSchema).enum.map((item) => `${paramName}===${JSON.stringify(item)}`).join('||'));
      if (isNullable) builder.push(')');
      return;
    } else if (key === 'values') {
      if (isNullable) builder.push(`(${paramName}===null||`);

      builder.push(`typeof ${paramName}==='object'&&${paramName}!==null&&Object.values(${paramName}).every((o)=>`);
      jtd_json_assert_compile_conditions((schema as JTDValuesSchema).values, 'o', state, false);
      builder.push(')');

      if (isNullable) builder.push(')');
      return;
    }
  }

  if (hasObjectCondition && isNullable) builder.push(')');
}

// eslint-disable-next-line
export function jtd_json_create_assert_func<const T extends RootJTDSchema>(schema: T): (o: any) => o is InferRootJTDSchema<T> {
  const keys: string[] = [];
  const values: any[] = [];
  // @ts-expect-error Disable compileCallback
  const state = compile_state_init(null, keys, values);
  jtd_json_assert_compile(schema, 'o', state);
  // eslint-disable-next-line
  return Function(...keys, `${state[3].join('')}return (o)=>${state[0].join('')}`)(...values);
}
