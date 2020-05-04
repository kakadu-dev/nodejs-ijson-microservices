const assert                    = require('assert');
const { MicroserviceException } = require('../../index').exceptions;

describe('Test MicroserviceException', () => {
	const defaults = {
		code:    10,
		status:  0,
		service: MicroserviceException.service,
		message: 'Unknown microservice exception.',
	};

	it('should create default instance', () => {
		const exception = new MicroserviceException();

		assert.deepEqual(exception.toJSON(), defaults);
	});

	it('should works methods', () => {
		const args      = {
			code:    1,
			status:  2,
			message: 'def',
		};
		const exception = new MicroserviceException(args);

		assert.deepEqual(exception.toJSON(), {
			...args,
			service: MicroserviceException.service,
		});
		assert.deepEqual(exception.defaults(), defaults);
		assert.ok(exception.toString().startsWith('Error:'));
	});
});
