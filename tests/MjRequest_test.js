const assert        = require('assert');
const { MjRequest } = require('../index');

describe('Test MjRequest', () => {
	const rpc = {
		jsonrpc: '2.0',
		method:  null,
	};

	it('should create default instance', () => {
		const request = new MjRequest();

		assert.deepEqual(request.toJSON(), rpc);
	});

	it('should works methods', () => {
		const args    = {
			id:     1,
			method: 'test',
			params: {
				hello: 'world',
			},
		};
		const request = new MjRequest(args);

		assert.deepEqual(request.toJSON(), {
			...rpc,
			id:     args.id,
			method: args.method,
			params: { ...args.params },
		});

		assert.equal(request.getId(), args.id);
		assert.equal(request.getMethod(), args.method);
		assert.equal(request.getParams(), args.params);
	});
});
