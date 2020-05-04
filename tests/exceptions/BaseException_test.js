const assert            = require('assert');
const { BaseException } = require('../../index').exceptions;

describe('Test BaseException', () => {
	const defaults = {
		code:    0,
		status:  0,
		service: 'unknown',
		message: 'Undefined error.',
	};

	it('should create default instance', () => {
		const exception = new BaseException();

		assert.deepEqual(exception.toJSON(), defaults);
	});

	it('should works methods', () => {
		const args      = {
			code:    1,
			status:  2,
			service: 'custom',
			message: 'def',
		};
		const exception = new BaseException(args);

		assert.deepEqual(exception.toJSON(), {
			...args,
		});
		assert.deepEqual(exception.defaults(), defaults);
		assert.ok(exception.toString().startsWith('Error:'));
	});
});
