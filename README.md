# ts-symbol-enum
This is a TypeScript library for strictly type-safe enums based on symbols. It is meant to replace Typescript enum, which can't be used with TS `erasableSyntaxOnly` option.

## Pros
* Runtime type safety: The library ensures that only valid enum values can be used at runtime, preventing potential bugs and errors.
* Compile-time type safety: The library provides compile-time type checking, ensuring that only valid enum values can be assigned to variables or passed as function arguments.
* Works in environments where TypeScript `erasableSyntaxOnly` option is enabled.
* Can use any underlying type for enum values, including `string`, `number`, and `bigint` (uses [SameValueZero algorithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness#same-value-zero_equality) for comparison).
* Can be used as discriminator of discriminated union, just like primitive types.
* Generates unique symbols for each enum value, preventing accidental collisions with other enums with same underlying values.
* Generates arrays of enum values, keys, and entries for easy iteration and manipulation of enum values.
* Generates helper functions for converting between enum values and their base values
* No code generation required, making it easy to use and integrate into existing projects.

## Cons
* More verbose syntax compared to traditional TypeScript enums.
* No value inlining compared to traditional TypeScript enums.

## Example Usage

Declaration:
```ts
import { SymbolEnum } from 'ts-symbol-enum';

const TestEnum = SymbolEnum(
  'TestEnum',
  [class { static readonly A: unique symbol;}, 10],
  [class { static readonly B: unique symbol;}, 20],
  [class { static readonly C: unique symbol;}, 30],
);
type TestEnum<T = unknown> = SymbolEnum<typeof TestEnum, T>;
```

Resulting type:
```ts
type TestEnum = {
  readonly size: 3;
  readonly length: 3;
  readonly name: 'TestEnum';
  readonly keys: readonly ['A', 'B', 'C'];
  readonly values: readonly [unique symbol, unique symbol, unique symbol];
  readonly originalValues: readonly [10, 20, 30];
  readonly entries: readonly [readonly ['A', unique symbol], readonly ['B', unique symbol], readonly ['C', unique symbol]];
  parse: (value: unknown) => unique symbol | unique symbol | unique symbol;
  isValidValue: (value: unknown) => value is 10 | 20 | 30;
  unparse: (symbolValue: unique symbol | unique symbol | unique symbol) => 10 | 20 | 30;
  getKeyName: (symbolValue: unique symbol | unique symbol | unique symbol) => 'A' | 'B' | 'C';
  readonly 0: unique symbol;
  readonly 1: unique symbol;
  readonly 2: unique symbol;
  readonly A: unique symbol;
  readonly B: unique symbol;
  readonly C: unique symbol;
};
```

Declare variable which can take any value of the `TestEnum`:
```ts
const a: TestEnum = TestEnum.A;
```

Declare variable which can take just one value from `TestEnum`:
```ts
const a: TestEnum<'A'> = TestEnum.A;
// OR
const a: typeof TestEnum.A = TestEnum.A;
```

Declare variable which can take just two values from `TestEnum`:
```ts
const a: TestEnum<'A'> | TestEnum<'B'> = TestEnum.A;
// OR
const a: TestEnum<'A' | 'B'> = TestEnum.A;
```

Convert value from base type to enum value:
```ts
const a: TestEnum = TestEnum.parse(10); // ok
const b: TestEnum = TestEnum.parse(99); // throws error
```

Convert value from enum value to base type:
```ts
const a: 10 | 20 | 30 = TestEnum.unparse(TestEnum.A); // 10
```

