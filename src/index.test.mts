import { suite, test } from 'node:test';
import assert from 'node:assert';
import { SymbolEnum } from './index.mts';

// Compile-time type assertions
type Assert<T extends true> = T;
type AssertFalse<T extends false> = T;
type Assignable<A, B> = A extends B ? true : false;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// Shared test data
const TestEnum = SymbolEnum(
  'TestEnum',
  [class { static readonly A: unique symbol;}, 10],
  [class { static readonly B: unique symbol;}, 20],
);
type TestEnum<T = unknown> = SymbolEnum<typeof TestEnum, T>;

const TestEnum2 = SymbolEnum(
  'TestEnum2',
  [class { static readonly ZED: unique symbol;}, 'Z'],
  [class { static readonly NINE: unique symbol;}, 9],
  [class { static readonly NEGATIVE_ONE: unique symbol;}, -1n],
  [class { static readonly MINUS_ONE: unique symbol;}, -1n],
  [class { static readonly UNDEFINED: unique symbol;}, undefined],
  [class { static readonly NULL: unique symbol;}, null],
  [class { static readonly NAN: unique symbol;}, NaN],
  [class { static readonly ZERO: unique symbol;}, 0],
  [class { static readonly BIG_ZERO: unique symbol;}, 0n],
);
type TestEnum2<T = unknown> = SymbolEnum<typeof TestEnum2, T>;

// Compile-time type tests
type _ = [
  Assert<Equal<typeof TestEnum.name, 'TestEnum'>>,
  Assert<Equal<typeof TestEnum.length, 2>>,
  Assert<Equal<typeof TestEnum.size, 2>>,
  Assert<Assignable<typeof TestEnum.A, symbol>>,
  Assert<Assignable<typeof TestEnum.B, symbol>>,
  AssertFalse<Equal<typeof TestEnum.A, typeof TestEnum.B>>,
  Assert<Equal<typeof TestEnum[0], typeof TestEnum.A>>,
  Assert<Equal<typeof TestEnum[1], typeof TestEnum.B>>,
  Assert<Equal<typeof TestEnum.keys, readonly ['A', 'B']>>,
  Assert<Equal<typeof TestEnum.values, readonly [typeof TestEnum.A, typeof TestEnum.B]>>,
  Assert<Equal<typeof TestEnum.rawValues, readonly [10, 20]>>,
  Assert<Equal<typeof TestEnum.entries, readonly [readonly ['A', typeof TestEnum.A], readonly ['B', typeof TestEnum.B]]>>,
  Assert<Equal<typeof TestEnum.parse, (value: unknown) => typeof TestEnum.A | typeof TestEnum.B>>,
  Assert<Equal<typeof TestEnum.unparse, (symbolValue: typeof TestEnum.A | typeof TestEnum.B) => 10 | 20>>,
  Assert<Equal<typeof TestEnum.keyOf, (symbolValue: typeof TestEnum.A | typeof TestEnum.B) => 'A' | 'B'>>,
  Assert<Equal<typeof TestEnum.isValidValue, (value: unknown) => value is 10 | 20>>,
  Assert<Equal<typeof TestEnum.has, (keyName: unknown) => keyName is 'A' | 'B'>>,

  Assert<Assignable<typeof TestEnum, ArrayLike<symbol>>>,
  // Assert<Assignable<typeof TestEnum, ReadonlyMap<string, symbol>>>, // TODO: work towards this
];

suite('SymbolEnum runtime tests', () => {
  test('SymbolEnum should fill all necessary properties', () => {
    assert.strictEqual(TestEnum.name, 'TestEnum');
    assert.strictEqual(TestEnum.length, 2);
    assert.strictEqual(TestEnum.size, 2);
    assert.strictEqual(typeof TestEnum.A, 'symbol');
    assert.strictEqual(typeof TestEnum.B, 'symbol');
    assert.notStrictEqual(TestEnum.A, TestEnum.B);
    assert.strictEqual(TestEnum[0], TestEnum.A);
    assert.strictEqual(TestEnum[1], TestEnum.B);
    assert.deepStrictEqual(TestEnum.keys, ['A', 'B']);
    assert.deepStrictEqual(TestEnum.values, [TestEnum.A, TestEnum.B]);
    assert.deepStrictEqual(TestEnum.rawValues, [10, 20]);
    assert.deepStrictEqual(TestEnum.entries, [['A', TestEnum.A], ['B', TestEnum.B]]);
    assert.strictEqual(typeof TestEnum.parse, 'function');
    assert.strictEqual(typeof TestEnum.unparse, 'function');
    assert.strictEqual(typeof TestEnum.keyOf, 'function');
    assert.strictEqual(typeof TestEnum.isValidValue, 'function');
    assert.strictEqual(typeof TestEnum.has, 'function');
  });

  test('SymbolEnum should throw for classes without static symbol property', () => {
    assert.throws(
      () => SymbolEnum(
        'InvalidEnum',
        [class { static readonly A: unique symbol;}, 10],
        [class { }, 20],
      ),
      /^Error: InvalidEnum: Class at index 1 does not have a static symbol property! It must have exactly one static symbol property\.$/,
    );
  });

  test('SymbolEnum should throw for classes with multiple static symbol properties', () => {
    assert.throws(
      () => SymbolEnum(
        'InvalidEnum',
        [class { static readonly A: unique symbol; static readonly B: unique symbol;}, 10],
      ),
      /^Error: InvalidEnum: Class at index 0 has multiple static symbol properties! It must have exactly one static symbol property\.$/,
    );
  });

  test('SymbolEnum should throw for classes with static symbol properties with numeric names', () => {
    assert.throws(
      () => SymbolEnum(
        'InvalidEnum',
        [class { static readonly '123': unique symbol;}, 10],
      ),
      /^Error: InvalidEnum: Class at index 0 has static symbol property with a numeric name!$/,
    );
  });

  suite('TestEnum.parse', () => {
    test('TestEnum.parse should find existing values correctly', () => {
      assert.strictEqual(TestEnum.parse(10), TestEnum.A);
      assert.strictEqual(TestEnum.parse(20), TestEnum.B);
    });

    test('TestEnum.parse should find falsy values correctly', () => {
      assert.strictEqual(TestEnum2.parse(undefined), TestEnum2.UNDEFINED);
      assert.strictEqual(TestEnum2.parse(null), TestEnum2.NULL);
      assert.strictEqual(TestEnum2.parse(NaN), TestEnum2.NAN);
      assert.strictEqual(TestEnum2.parse(0), TestEnum2.ZERO);
      assert.strictEqual(TestEnum2.parse(0n), TestEnum2.BIG_ZERO);
    });

    test('TestEnum.parse should find first enum member for duplicate values', () => {
      assert.strictEqual(TestEnum2.parse(-1n), TestEnum2.NEGATIVE_ONE);
    });

    test('TestEnum.parse should throw for non-existing values', () => {
      assert.throws(
        () => TestEnum.parse(30),
        /^TypeError: TestEnum.parse: Invalid value for enum TestEnum: 30! Valid values are: 10, 20\.$/,
      );
    });
  });

  suite('TestEnum.isValidValue', () => {
    test('TestEnum.isValidValue should find existing values correctly', () => {
      assert.strictEqual(TestEnum.isValidValue(10), true);
      assert.strictEqual(TestEnum.isValidValue(20), true);
    });

    test('TestEnum.isValidValue should return false for non-existing values', () => {
      assert.strictEqual(TestEnum.isValidValue(30), false);
    });
  });

  suite('TestEnum.unparse', () => {
    test('TestEnum.unparse should find existing symbols correctly', () => {
      assert.strictEqual(TestEnum.unparse(TestEnum.A), 10);
      assert.strictEqual(TestEnum.unparse(TestEnum.B), 20);
    });

    test('TestEnum.unparse should find falsy values correctly', () => {
      assert.strictEqual(TestEnum2.unparse(TestEnum2.UNDEFINED), undefined);
      assert.strictEqual(TestEnum2.unparse(TestEnum2.NAN), NaN);
      assert.strictEqual(TestEnum2.unparse(TestEnum2.ZERO), 0);
    });

    test('TestEnum.unparse should throw for non-existing symbols', () => {
      const fakeSymbol: any = Symbol('TestEnum.FAKE');
      assert.throws(
        () => TestEnum.unparse(fakeSymbol),
        /^TypeError: TestEnum.unparse: Invalid symbol for enum TestEnum: Symbol\(TestEnum.FAKE\)!$/,
      );
    });
  });

  suite('TestEnum.keyOf', () => {
    test('TestEnum.keyOf should find existing symbols correctly', () => {
      assert.strictEqual(TestEnum.keyOf(TestEnum.A), 'A');
      assert.strictEqual(TestEnum.keyOf(TestEnum.B), 'B');
    });

    test('TestEnum.keyOf should throw for non-existing symbols', () => {
      const fakeSymbol: any = Symbol('TestEnum.FAKE');
      assert.throws(
        () => TestEnum.keyOf(fakeSymbol),
        /^TypeError: TestEnum.keyOf: Invalid symbol for enum TestEnum: Symbol\(TestEnum.FAKE\)!$/,
      );
    });
  });

  suite('TestEnum.has', () => {
    test('TestEnum.has should find existing keys correctly', () => {
      assert.strictEqual(TestEnum.has('A'), true);
      assert.strictEqual(TestEnum.has('B'), true);
    });

    test('TestEnum.has should return false for non-existing keys', () => {
      assert.strictEqual(TestEnum.has('C'), false);
    });
  });
});

