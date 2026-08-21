
type SymbolProperties<T> = {
  [K in keyof T as T[K] extends symbol ? K : never]: T[K];
};

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};



type MapIndex<
  T extends readonly (readonly unknown[])[],
  I extends number,
> = { [K in keyof T]: T[K][I] };

type IsUnion<T, U = T> =
    T extends any
        ? [U] extends [T] ? false : true
        : never;

type ExactlyOneSymbolStatic<T> =
  IsUnion<keyof SymbolProperties<T>> extends true
    ? never
    : SymbolProperties<T>;

type TupleToObject<T extends readonly unknown[]> = {
  [K in keyof T as K extends `${infer N extends number}` ? N : never]: T[K];
};

type ClassAndValuePair = readonly [abstract new () => any, unknown];
type ClassAndValuePairs = readonly ClassAndValuePair[];

type InfoFromClassAndValuePair<T extends ClassAndValuePair> = T extends readonly [infer C, infer V]
  ? SymbolProperties<C> extends infer SP
  ? keyof SP extends infer SPK extends keyof SP
  ? readonly [
    SPK,
    V,
    SP[SPK],
    readonly [SPK, SP[SPK]],
  ]
  : never
  : never
  : never;

type InfoFromClassAndValuePairs<
  E extends ClassAndValuePairs,
> =
  E extends readonly [
    infer Head extends ClassAndValuePair,
    ...infer Rest extends ClassAndValuePairs
  ]
    ? readonly [InfoFromClassAndValuePair<Head>, ...InfoFromClassAndValuePairs<Rest>]
    : readonly [];


type EnumObjectType<N extends string, E extends ClassAndValuePairs> =
  InfoFromClassAndValuePairs<E> extends infer Info extends readonly (readonly unknown[])[]
  ? MapIndex<Info, 0> extends infer KeyTuple extends readonly unknown[]
  ? MapIndex<Info, 1> extends infer ValueTuple extends readonly unknown[]
  ? MapIndex<Info, 2> extends infer SymbolValuesTuple extends readonly unknown[]
  ? MapIndex<Info, 3> extends infer SymbolEntriesTuple extends readonly (readonly [string, symbol])[]
  ? Prettify<{
    readonly size: E['length'];
    readonly length: E['length'];
    readonly name: N;
    readonly keys: KeyTuple;
    readonly values: SymbolValuesTuple;
    readonly rawValues: ValueTuple;
    readonly entries: SymbolEntriesTuple;
    parse(value: unknown): SymbolValuesTuple[number];
    isValidValue(value: unknown): value is ValueTuple[number];
    unparse(symbolValue: SymbolValuesTuple[number]): ValueTuple[number];
    keyOf(symbolValue: SymbolValuesTuple[number]): KeyTuple[number];
    has(keyName: unknown): keyName is KeyTuple[number];
  } & {
    readonly [P in SymbolEntriesTuple[number] as P[0]]: P[1];
  } & TupleToObject<SymbolValuesTuple>>
  : never
  : never
  : never
  : never
  : never;

export function SymbolEnum<
  const N extends string,
  const E extends ClassAndValuePairs,
>(name: N, ...classAndRawValuePairs: E): EnumObjectType<N, E> {

  const length: E['length'] = classAndRawValuePairs.length;

  const keys: string[] = [];
  const values: symbol[] = [];
  const rawValues: unknown[] = [];
  const entries: (readonly [string, symbol])[] = [];
  const parseMap = new Map<unknown, symbol>();
  const unparseMap = new Map<symbol, unknown>();
  const keyOfMap = new Map<symbol, string>();
  const keySymbolMap = new Map<string, symbol>();
  const record: Record<string, symbol> = {};
  let index = 0;
  for (const [classDecl, rawValue] of classAndRawValuePairs) {
    const classDeclKeys: string[] = Object.keys(classDecl);
    if (classDeclKeys.length > 1) { // TODO: enforce at compile time as well
      throw new Error(`${name}: Class at index ${index} has multiple static symbol properties! It must have exactly one static symbol property.`);
    }
    const key: string | undefined = classDeclKeys[0];
    if (!key) { // TODO: enforce at compile time as well
      throw new Error(`${name}: Class at index ${index} does not have a static symbol property! It must have exactly one static symbol property.`);
    }
    if (/^-?\d+$/.test(key)) { // TODO: enforce at compile time as well
      throw new Error(`${name}: Class at index ${index} has static symbol property with a numeric name!`);
    }
    const symbolValue: symbol = Symbol(`${name}.${key}`);
    keys.push(key);
    values.push(symbolValue);
    rawValues.push(rawValue);
    entries.push(Object.freeze([key, symbolValue]));
    if (!parseMap.has(rawValue)) {
      parseMap.set(rawValue, symbolValue);
    }
    unparseMap.set(symbolValue, rawValue);
    keyOfMap.set(symbolValue, key);
    keySymbolMap.set(key, symbolValue);
    record[key] = symbolValue;
    record[index++] = symbolValue;
  }

  let enumObject: EnumObjectType<N, E> = {
    ...record,
    size: length,
    length,
    name,
    keys: Object.freeze(keys),
    values: Object.freeze(values),
    rawValues: Object.freeze(rawValues),
    entries: Object.freeze(entries),
    parse: (value: unknown): symbol => {
      const symbolValue: symbol | undefined = parseMap.get(value);
      if (symbolValue === undefined) {
        throw new TypeError(`${name}.parse: Invalid value for enum ${name}: ${value}! Valid values are: ${rawValues.join(', ')}.`);
      }
      return symbolValue;
    },
    isValidValue: (value: unknown): boolean => {
      return parseMap.has(value);
    },
    unparse: (symbolValue: symbol): unknown => {
      if (!unparseMap.has(symbolValue)) {
        throw new TypeError(`${name}.unparse: Invalid symbol for enum ${name}: ${symbolValue.toString()}!`);
      }
      return unparseMap.get(symbolValue);
    },
    keyOf: (symbolValue: symbol): string => {
      const key: string | undefined = keyOfMap.get(symbolValue);
      if (key === undefined) {
        throw new TypeError(`${name}.keyOf: Invalid symbol for enum ${name}: ${symbolValue.toString()}!`);
      }
      return key;
    },
    has: (keyName: string): boolean => {
      return keySymbolMap.has(keyName);
    },
  } as unknown as EnumObjectType<N, E>;
  enumObject = Object.freeze(Object.assign(Object.create(null), enumObject));
  return enumObject;
}

export type SymbolEnum<T extends object, K> = Prettify<
  SymbolProperties<T> extends infer SP
  ? [K, unknown] extends [unknown, K]
    ? SP[keyof SP]
    : (K extends keyof SP ? SP[K] : never)
  : never
>;
