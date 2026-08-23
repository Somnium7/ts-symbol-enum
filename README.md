# ts-symbol-enum
`ts-symbol-enum` provides enum-like objects whose members are distinct unique symbol types while retaining arbitrary raw values for serialization/parsing. It is designed as a runtime alternative to TypeScript enum that works with `erasableSyntaxOnly` option.

## Pros
* Runtime type safety: The library ensures that only valid enum values can be used at runtime, preventing potential bugs and errors.
* Compile-time type safety: The library provides compile-time type checking, ensuring that only valid enum values can be assigned to variables or passed as function arguments.
* Works in environments where TypeScript `erasableSyntaxOnly` option is enabled.
* Can use **any** underlying type for enum values, including `string`, `number`, and `bigint` (uses [SameValueZero algorithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness#same-value-zero_equality) for comparison).
* Can be used as discriminator of discriminated union, just like primitive types.
* Can have multiple enum values with the same underlying value, parse will return the first one (by declaration order).
* Generates unique symbols for each enum value, preventing accidental collisions with other enums with same underlying values.
* Generates arrays of enum values, keys, and entries for easy iteration and manipulation of enum values.
* Generates helper functions for converting between enum values and their base values.
* No code generation required, making it easy to use and integrate into existing projects.
* ESM module compatible

## Cons
* More verbose declaration syntax compared to traditional TypeScript enums.
* No value inlining compared to traditional TypeScript enums.
* `CommonJS` not supported.

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
  readonly keysArray: readonly ['A', 'B', 'C'];
  readonly valuesArray: readonly [unique symbol, unique symbol, unique symbol];
  readonly rawValuesArray: readonly [10, 20, 30];
  readonly entriesArray: readonly [readonly ['A', unique symbol], readonly ['B', unique symbol], readonly ['C', unique symbol]];
  parse: (rawValue: unknown) => unique symbol | unique symbol | unique symbol;
  tryParse: (rawValue: unknown) => unique symbol | unique symbol | unique symbol | undefined;
  unparse: (symbolValue: unique symbol | unique symbol | unique symbol) => 10 | 20 | 30;
  keyOf: (symbolValue: unique symbol | unique symbol | unique symbol) => 'A' | 'B' | 'C';
  // ...
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
const c: TestEnum = TestEnum.tryParse(99) ?? TestEnum.A; // use fallback value if parsing fails
```

Convert value from enum value to base type:
```ts
const a: 10 | 20 | 30 = TestEnum.unparse(TestEnum.A); // 10
```

Use in discriminated union:
```ts
interface DiscriminatedUnionA {
  type: TestEnum<'A'>;
  a: string;
}
interface DiscriminatedUnionB {
  type: TestEnum<'B'>;
  b: number;
}
type DiscriminatedUnion = DiscriminatedUnionA | DiscriminatedUnionB;

function testDiscriminatedUnion(value: DiscriminatedUnion) {
  if (value.type === TestEnum.A) {
    value satisfies DiscriminatedUnionA;
  } else {
    value satisfies DiscriminatedUnionB;
  }
}
```
