
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
    readonly originalValues: ValueTuple;
    readonly entries: SymbolEntriesTuple;
    parse(value: unknown): SymbolValuesTuple[number];
    isValidValue(value: unknown): value is ValueTuple[number];
    unparse(symbolValue: SymbolValuesTuple[number]): ValueTuple[number];
    getKeyName(symbolValue: SymbolValuesTuple[number]): KeyTuple[number];
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
>(name: N, ...classAndOriginalValuePairs: E): EnumObjectType<N, E> {

  const length: E['length'] = classAndOriginalValuePairs.length;

  const keys: string[] = [];
  const values: symbol[] = [];
  const originalValues: unknown[] = [];
  const entries: [string, symbol][] = [];
  const parseMap = new Map<unknown, symbol>();
  const unparseMap = new Map<symbol, unknown>();
  const keyMap = new Map<symbol, string>();
  const record: Record<string, symbol> = {};
  let index = 0;
  for (const [classDecl, originalValue] of classAndOriginalValuePairs) {
    const key: string | undefined = Object.keys(classDecl)[0];
    if (!key) {
      throw new Error(`${name}: Class at index ${index} does not have a static symbol property.`);
    }
    const symbolValue: symbol = Symbol(`${name}.${key}`);
    keys.push(key);
    values.push(symbolValue);
    originalValues.push(originalValue);
    entries.push([key, symbolValue]);
    parseMap.set(originalValue, symbolValue);
    unparseMap.set(symbolValue, originalValue);
    keyMap.set(symbolValue, key);
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
    originalValues: Object.freeze(originalValues),
    entries: Object.freeze(entries),
    parse: (value: unknown): symbol => {
      const symbolValue: symbol | undefined = parseMap.get(value);
      if (symbolValue === undefined) {
        throw new TypeError(`${name}.parse: Invalid value for enum ${name}: ${value}! Valid values are: ${originalValues.join(', ')}.`);
      }
      return symbolValue;
    },
    isValidValue: (value: unknown): boolean => {
      return parseMap.has(value);
    },
    unparse: (symbolValue: symbol): unknown => {
      const originalValue: unknown = unparseMap.get(symbolValue);
      if (originalValue === undefined) {
        throw new TypeError(`${name}.unparse: Invalid symbol for enum ${name}: ${symbolValue.toString()}!`);
      }
      return originalValue;
    },
    getKeyName: (symbolValue: symbol): string => {
      const key: string | undefined = keyMap.get(symbolValue);
      if (key === undefined) {
        throw new TypeError(`${name}.getKeyName: Invalid symbol for enum ${name}: ${symbolValue.toString()}!`);
      }
      return key;
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
