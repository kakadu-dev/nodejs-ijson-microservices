const BaseException = require('./BaseException');

/**
 * Microservice exception
 */
class MicroserviceException extends BaseException
{
	/**
	 * @type {string}
	 */
	static service = 'microservice';

	/**
	 * @inheritDoc
	 */
	defaults() {
		return {
			...super.defaults(),
			code:    10,
			message: 'Unknown microservice exception.',
			service: MicroserviceException.service,
		};
	}
}

module.exports = MicroserviceException;
