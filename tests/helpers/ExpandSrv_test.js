const assert     = require('assert');
const proxyquire = require('proxyquire');
const ExpandSrv  = proxyquire('../../src/helpers/ExpandSrv', {
	dns: {
		resolveSrv: (domain, callback) => {
			callback(null, [
				{ priority: 1, weight: 1, name: 'ijson.demo', port: 8001 }
			])
		},
	},
});

describe('Test ExpandSrv', () => {
	it('should correct expand with protocol', async () => {
		const noSrv = 'http://ijson.local';
		const srv = 'http://ijson.local.srv';

		const result = await ExpandSrv(noSrv);
		assert.equal(result, noSrv);

		const success = await ExpandSrv(srv);
		assert.equal(success, 'http://ijson.demo:8001');
	});

	it('should correct expand without protocol', async () => {
		const result = await ExpandSrv('redis-test.local.srv');
		assert.equal(result, 'ijson.demo:8001');
	});
});
