// @flow
import test from 'ava';
import Base from '../src/Base.js';

test('Instance of Base is a Base Class', async (t) => {
    const base = new Base();
    t.true(base instanceof Base);
});
