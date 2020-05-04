const assert           = require('assert');
const { Microservice } = require('../index');

describe('Test Microservice', () => {
	it('should throw exception if create via constructor', () => {
		assert.throws(() => {
			new Microservice({ name: 'Test' });
		}, Error);
	});
});
