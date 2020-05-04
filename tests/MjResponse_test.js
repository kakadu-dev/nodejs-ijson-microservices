const assert         = require('assert');
const { MjResponse } = require('../index');

describe('Test MjResponse', () => {
	const rpc = {
		jsonrpc: '2.0',
	};

	it('should create default instance', () => {
		const response = new MjResponse();

		assert.deepEqual(response.toJSON(), undefined);
	});

	it('should works result response', () => {
		const args     = {
			id:     1,
			result: {
				hello: 'world',
			},
		};
		const response = new MjResponse(args);

		assert.deepEqual(response.toJSON(), {
			...rpc,
			id:     args.id,
			result: { ...args.result },
		});
		assert.equal(response.getId(), args.id);
		assert.deepEqual(response.getResult(), args.result);
	});

	it('should work error response', () => {
		const args     = {
			id:    1,
			error: {
				message: 'bad',
			},
		};
		const response = new MjResponse(args);

		assert.deepEqual(response.toJSON(), {
			...rpc,
			id:    args.id,
			error: { ...args.error },
		});
		assert.equal(response.getId(), args.id);
		assert.deepEqual(response.getError(), args.error);
	});
});
