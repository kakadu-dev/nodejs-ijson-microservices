const BaseException = require('./BaseException');

/**
 * Gateway exception
 */
class GatewayException extends BaseException
{
	/**
	 * @type {string}
	 */
	static service = 'gateway';

	/**
	 * @inheritDoc
	 */
	defaults() {
		return {
			...super.defaults(),
			code:    5,
			message: 'Unknown gateway exception.',
			service: GatewayException.service,
		};
	}
}

module.exports = GatewayException;
