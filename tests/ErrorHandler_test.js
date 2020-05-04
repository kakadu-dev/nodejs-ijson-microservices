const assert         = require('assert');
const ErrorHandler   = require('../src/ErrorHandler');
const { MjResponse } = require('../index');

describe('Test ErrorHandler', () => {
	let result = null;

	const res     = {
		json(val) {
			result = val;
		},
	};
	const next    = () => null;
	const error   = { status: 400, code: 1, message: 'bad', stack: 'stack', type: 'custom', service: 'my' };
	const request = { body: { id: 33 } };

	beforeEach(() => {
		result = null;
	});

	it('should return MjResponse for development env', () => {
		const handler = ErrorHandler('develpment');

		assert.ok(typeof handler === 'function');
		assert.ok(result === null);

		handler(error, request, res, next);

		assert.ok(result instanceof MjResponse);
		assert.deepEqual(result.toJSON(), {
			jsonrpc: '2.0',
			id:      request.body.id,
			error:   {
				name: 'Bad Request',
				...error,
			},
		});
	});

	it('should return MjResponse for production env', () => {
		const handler = ErrorHandler('production');

		assert.ok(result === null);

		handler(error, request, res, next);

		assert.ok(result instanceof MjResponse);
		assert.deepEqual(result.toJSON(), {
			jsonrpc: '2.0',
			id:      request.body.id,
			error:   {
				status:  error.status,
				code:    error.code,
				message: error.message,
			},
		});
	});
});
