const assert      = require('assert');
const { Gateway } = require('../index');

describe('Test Gateway', () => {
	it('should throw exception if create via constructor', () => {
		assert.throws(() => {
			new Gateway({ name: 'Test' });
		}, Error);
	});
});
