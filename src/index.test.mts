import { suite, test } from 'node:test';
import assert from 'node:assert';
import { SymbolEnum } from './index.mts';


const TestEnum = SymbolEnum(
  'TestEnum',
  [class { static readonly A: unique symbol;}, 10],
  [class { static readonly B: unique symbol;}, 20],
);
type TestEnum<T = unknown> = SymbolEnum<typeof TestEnum, T>;


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
    assert.deepStrictEqual(TestEnum.originalValues, [10, 20]);
    assert.deepStrictEqual(TestEnum.entries, [['A', TestEnum.A], ['B', TestEnum.B]]);
    assert.strictEqual(typeof TestEnum.parse, 'function');
    assert.strictEqual(typeof TestEnum.unparse, 'function');
    assert.strictEqual(typeof TestEnum.getKeyName, 'function');
    assert.strictEqual(typeof TestEnum.isValidValue, 'function');
  });

  test('SymbolEnum should throw for classes without static symbol property', () => {
    assert.throws(
      () => SymbolEnum(
        'InvalidEnum',
        [class { static readonly A: unique symbol;}, 10],
        [class { }, 20],
      ),
      /^Error: InvalidEnum: Class at index 1 does not have a static symbol property\.$/,
    );
  });

  suite('TestEnum.parse', () => {
    test('TestEnum.parse should find existing values correctly', () => {
      assert.strictEqual(TestEnum.parse(10), TestEnum.A);
      assert.strictEqual(TestEnum.parse(20), TestEnum.B);
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

    test('TestEnum.unparse should throw for non-existing symbols', () => {
      const fakeSymbol: any = Symbol('TestEnum.FAKE');
      assert.throws(
        () => TestEnum.unparse(fakeSymbol),
        /^TypeError: TestEnum.unparse: Invalid symbol for enum TestEnum: Symbol\(TestEnum.FAKE\)!$/,
      );
    });
  });

  suite('TestEnum.getKeyName', () => {
    test('TestEnum.getKeyName should find existing symbols correctly', () => {
      assert.strictEqual(TestEnum.getKeyName(TestEnum.A), 'A');
      assert.strictEqual(TestEnum.getKeyName(TestEnum.B), 'B');
    });

    test('TestEnum.getKeyName should throw for non-existing symbols', () => {
      const fakeSymbol: any = Symbol('TestEnum.FAKE');
      assert.throws(
        () => TestEnum.getKeyName(fakeSymbol),
        /^TypeError: TestEnum.getKeyName: Invalid symbol for enum TestEnum: Symbol\(TestEnum.FAKE\)!$/,
      );
    });
  });
});

