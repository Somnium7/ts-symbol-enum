# ts-symbol-enum

[NPM](https://www.npmjs.com/package/ts-symbol-enum) | [GitHub](https://github.com/Somnium7/ts-symbol-enum) | [MIT License](https://github.com/Somnium7/ts-symbol-enum/blob/main/LICENSE)

`ts-symbol-enum` creates immutable, enum-like objects whose members are distinct
symbol values and distinct TypeScript types. Each member also has an arbitrary
raw value for parsing, validation, and serialization.

It is a runtime alternative to TypeScript `enum` for projects using
`erasableSyntaxOnly`: no enum syntax, code generation, or reverse-mapping
conventions are involved.

## Why use it?

- **Nominal member identity.** `Status.ACTIVE` and `OtherStatus.ACTIVE` are
  different symbols, even when their names and raw values are the same.
- **Strong declaration inference.** Keys, members, tuples, array indexes, and
  raw values are inferred from the declaration as literals.
- **Runtime validation.** `parse`, `unparse`, and `keyOf` reject values that do
  not belong to the enum.
- **Serialization boundary.** Keep symbols inside the application and convert
  to and from strings, numbers, bigints, or other raw values at its edges.
- **Discriminated unions.** Symbol members narrow unions in the same way as
  literal strings or numbers.
- **Iteration.** The object is both array-like and map-like, with frozen arrays
  and standard map iteration methods.
- **No generated code.** It is an ordinary ESM function that constructs the
  object at runtime.

## Installation

```sh
npm install ts-symbol-enum
```

The package is ESM-only and currently requires Node.js 22 or newer and TypeScript 5.9 or newer.

## Quick start

```ts
import { SymbolEnum } from 'ts-symbol-enum';

const Status = SymbolEnum(
  'Status',
  [class { static readonly PENDING: unique symbol; }, 'pending'],
  [class { static readonly APPROVED: unique symbol; }, 'approved'],
  [class { static readonly REJECTED: unique symbol; }, 'rejected'],
);
type Status<K = unknown> = SymbolEnum<typeof Status, K>;

// The type alias is needed to refer to the union of all members as a type.
const anyStatus: Status = Status.PENDING;

// Use symbols inside the program.
function isFinished(status: Status): boolean {
  return status === Status.APPROVED || status === Status.REJECTED;
}

// Parse data received from an API or a file.
// The runtime value is checked, but the result is the union of Status members.
const status: Status = Status.parse('approved');

// Serialize data leaving the program.
const rawStatus: 'pending' | 'approved' | 'rejected' =
  Status.unparse(status);
```

The declaration also creates numeric properties, so `Status[0]` is
`Status.PENDING`, and named properties, so `Status.PENDING` is the preferred
form for normal application code.

## Select individual members

The call creates the runtime `Status` object, but that value is not itself a
type. The same-name type alias shown in the quick start connects the object to
its union of symbol types. Its generic parameter can select members by key:

```ts
const oneStatus: Status<'APPROVED'> = Status.APPROVED;
const twoStatuses: Status<'PENDING' | 'REJECTED'> = Status.REJECTED;

// For an individual member, a type alias is not necessary:
const approved: typeof Status.APPROVED = Status.APPROVED;
```

Without the alias, `const anyStatus: Status` does not work because `Status`
refers only to the runtime object. Individual member types can always be
written with `typeof`, for example
`typeof Status.APPROVED | typeof Status.REJECTED`.

## Generated types and collections

The declaration is preserved in the types of the generated properties. The
following assignments are checked as exact tuples, not widened arrays:

```ts
const keys: readonly ['PENDING', 'APPROVED', 'REJECTED'] = Status.keysArray;
const values: readonly [
  typeof Status.PENDING,
  typeof Status.APPROVED,
  typeof Status.REJECTED,
] = Status.valuesArray;
const rawValues: readonly ['pending', 'approved', 'rejected'] =
  Status.rawValuesArray;
const entries: readonly [
  readonly ['PENDING', typeof Status.PENDING],
  readonly ['APPROVED', typeof Status.APPROVED],
  readonly ['REJECTED', typeof Status.REJECTED],
] = Status.entriesArray;

const first: typeof Status.PENDING = Status[0];
```

The same precise unions are available when iterating. Keys and symbols are
visited in declaration order, and the object can be used directly in a
`for...of` loop:

```ts
for (const key of Status.keys()) {
  // key: 'PENDING' | 'APPROVED' | 'REJECTED'
  console.log(key);
}

for (const value of Status.values()) {
  // value: typeof Status.PENDING | typeof Status.APPROVED | typeof Status.REJECTED
  console.log(Status.keyOf(value));
}

for (const [key, value] of Status) {
  // key: 'PENDING' | 'APPROVED' | 'REJECTED'
  // value: typeof Status.PENDING | typeof Status.APPROVED | typeof Status.REJECTED
  console.log(key, value);
}
```

The raw-value type guard and map-like methods are useful when working with
unknown input or dynamic keys:

```ts
const rawValue: unknown = 'approved';
if (Status.isValidValue(rawValue)) {
  // rawValue: 'pending' | 'approved' | 'rejected'
  const status: Status = Status.parse(rawValue);
}

const key: string = 'APPROVED';
if (Status.has(key)) {
  // key: 'PENDING' | 'APPROVED' | 'REJECTED'
  const status = Status.get(key);
}
```

### Discriminated unions

```ts
interface Pending {
  status: Status<'PENDING'>;
  createdAt: Date;
}

interface Approved {
  status: Status<'APPROVED'>;
  approvedBy: string;
}

type Request = Pending | Approved;

function describe(request: Request): string {
  if (request.status === Status.PENDING) {
    return request.createdAt.toISOString();
  }
  return request.approvedBy;
}
```

## Raw values of any kind

Every JavaScript value can be used as a raw value. Strings, numbers, bigints,
booleans, `undefined`, `null`, `NaN`, objects, arrays, functions, and symbols
are only examples. This makes the library useful both for simple wire-format
values and for enums backed by richer application objects.

Raw-value matching uses JavaScript `Map`'s
[SameValueZero comparison](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness#same-value-zero_equality),
so `NaN` matches `NaN`, while `0` and `0n` remain different values. Objects,
arrays, and functions match by reference, just as they do when used as `Map`
keys; `0` and `-0` are treated as the same value.

The raw values do not have to all share one type. TypeScript preserves the
literal or specific type of each value in `rawValuesArray`, `parse`,
`tryParse`, `isValidValue`, and `unparse`.

Several members may have the same raw value. `parse` and `tryParse` return the
first matching member in declaration order; `unparse` still returns the raw
value associated with the specific symbol.

```ts
const Kind = SymbolEnum(
  'Kind',
  [class { static readonly FIRST: unique symbol; }, 'same'],
  [class { static readonly SECOND: unique symbol; }, 'same'],
);

Kind.parse('same') === Kind.FIRST; // true
Kind.unparse(Kind.SECOND); // 'same'
```

For example, an enum can also use object values when identity is meaningful:

```ts
const Permissions = {
  read: { name: 'read' },
  write: { name: 'write' },
} as const;

const Permission = SymbolEnum(
  'Permission',
  [class { static readonly READ: unique symbol; }, Permissions.read],
  [class { static readonly WRITE: unique symbol; }, Permissions.write],
);

Permission.parse(Permissions.read) === Permission.READ; // true
Permission.parse({ name: 'read' }); // throws: different object reference
```

### Representing absence with `undefined`

An enum can include a `NONE` member whose raw value is `undefined`, alongside
members backed by completely different raw-value types. This is useful when
the absence of a value is itself a meaningful state that should remain
distinct from an invalid or unrecognized value:

```ts
const Selection = SymbolEnum(
  'Selection',
  [class { static readonly NONE: unique symbol; }, undefined],
  [class { static readonly TEXT: unique symbol; }, 'text'],
  [class { static readonly INDEX: unique symbol; }, 0],
);
type Selection<K = unknown> = SymbolEnum<typeof Selection, K>;

const input: unknown = undefined;
const selection = Selection.tryParse(input) ?? Selection.NONE;
const rawSelection = Selection.unparse(selection);
// rawSelection: undefined | 'text' | 0

Selection.parse(undefined) === Selection.NONE; // true
```

`undefined` is stored and looked up like any other raw value. In particular,
`tryParse(undefined)` returns the `NONE` symbol; an unsuccessful parse also
returns `undefined`, so use `parse` when those two outcomes must be kept
strictly separate.

## API

For an enum declared as `Status`, the object contains:

| Property or method | Purpose |
| --- | --- |
| `name` | The declared enum name. |
| `size`, `length` | Number of members. |
| `Status.KEY` | The unique symbol for a named member. |
| `Status[index]` | The unique symbol at declaration index. |
| `keysArray` | Frozen tuple of member names. |
| `valuesArray` | Frozen tuple of symbols. |
| `rawValuesArray` | Frozen tuple of raw values. |
| `entriesArray` | Frozen tuple of `[key, symbol]` entries. |
| `parse(rawValue)` | Return the matching symbol or throw `TypeError`. |
| `tryParse(rawValue)` | Return the matching symbol or `undefined`. |
| `isValidValue(rawValue)` | Type guard that checks a raw value. |
| `unparse(symbol)` | Return the symbol's raw value or throw `TypeError`. |
| `keyOf(symbol)` | Return the symbol's key or throw `TypeError`. |
| `has(key)` | Check whether a key exists; acts as a key type guard. |
| `get(key)` | Get a symbol by key, or `undefined`. |
| `forEach(callback, thisArg?)` | Visit entries in declaration order. |
| `keys()` | Iterate over keys. |
| `values()` | Iterate over symbols. |
| `entries()` / `[Symbol.iterator]()` | Iterate over `[key, symbol]` pairs. |

The enum object, exposed arrays, and entry tuples are shallowly frozen. Raw
objects and other reference values are not cloned or deep-frozen. Map-like
iteration follows declaration order.

## Declaration constraints

Each entry must be a pair containing:

1. A class with exactly one `static readonly` property typed as `unique symbol`.
2. The raw value associated with that member.

Member names must be unique and must not be numeric names. These constraints
are checked by TypeScript where possible and validated again at runtime.

## Why is the declaration syntax so unusual?

The syntax is intentional. TypeScript's `unique symbol` type is the mechanism
that gives every member a distinct, nominal type. However, TypeScript does not
let a function infer a fresh `unique symbol` type from an ordinary string such
as `'PENDING'`; a type declaration has to introduce that unique symbol.

The empty class body provides that declaration without creating a class value
that the library needs to use. Its static property supplies two pieces of
compile-time information:

- the property name (`PENDING`), which becomes the enum key; and
- the `unique symbol` type, which becomes the member's precise type.

At runtime, `SymbolEnum` reads the class's static property name and creates the
actual symbol itself. This keeps the implementation compatible with
`erasableSyntaxOnly`, which permits type-only constructs to disappear during
transpilation but rejects TypeScript constructs that require runtime enum
transformation. In short, the verbose class is a small type-level adapter that
lets the library provide precise unique-symbol types with no code generation.

## Limitations

- The declaration is more verbose than native TypeScript enum syntax.
- Symbols are not inlined into emitted JavaScript.
- The package supports ESM imports only; CommonJS is not supported.
