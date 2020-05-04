const assert               = require('assert');
const { GatewayException } = require('../../index').exceptions;

describe('Test GatewayException', () => {
	const defaults = {
		code:    5,
		status:  0,
		service: GatewayException.service,
		message: 'Unknown gateway exception.',
	};

	it('should create default instance', () => {
		const exception = new GatewayException();

		assert.deepEqual(exception.toJSON(), defaults);
	});

	it('should works methods', () => {
		const args      = {
			code:    1,
			status:  2,
			message: 'def',
		};
		const exception = new GatewayException(args);

		assert.deepEqual(exception.toJSON(), {
			...args,
			service: GatewayException.service,
		});
		assert.deepEqual(exception.defaults(), defaults);
		assert.ok(exception.toString().startsWith('Error:'));
	});
});
