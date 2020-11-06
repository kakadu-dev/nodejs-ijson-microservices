const dns = require('dns');
const _   = require('lodash');

/**
 * Get jost and port from SRV record
 *
 * @param {string} host
 *
 * @return {Promise<undefined>}
 */
const main = host => {
	if (!host.endsWith('.srv')) {
		return host;
	}

	return new Promise((resolve, reject) => {
		const result   = host.split('://');
		const protocol = result?.[1]?.length > 0 ? `${result[0]}://` : '';
		const domain   = protocol.length > 0 ? result[1] : result[0];

		dns.resolveSrv(domain.replace(/.srv$/, ''), (err, addresses) => {
			if (err) {
				return reject(err);
			}
			const sortedAddresses = _.sortBy(addresses, ['priority', 'weight']);

			const ijsonHost = sortedAddresses?.[0]?.name ?? null;
			const ijsonPort = sortedAddresses?.[0]?.port ?? null;

			return resolve(`${protocol}${ijsonHost}:${ijsonPort}`);
		});
	});
};

module.exports = main;
