/**
 * Base RPC exception
 */
class BaseException extends Error
{
	/**
	 * @type {number} error code
	 */
	code;

	/**
	 * @type {number}
	 */
	status;

	/**
	 * @type {null|string} service name
	 */
	service;

	/**
	 * @constructor
	 *
	 * @param {Object} props
	 */
	constructor(props = {}) {
		super(props.message || 'Undefined error.');

		const d = this.defaults();

		this.code    = props.code || d.code;
		this.status  = props.status || d.status;
		this.service = props.service || d.service;
		this.message = props.message || d.message;
	}

	/**
	 * Defaults values
	 *
	 * @return {{code: number, service: string, message: string, status: number}}
	 */
	defaults() {
		return {
			code:    0,
			status:  0,
			service: 'unknown',
			message: 'Undefined error.',
		};
	}

	/**
	 * Convert error object to string
	 *
	 * @return {string}
	 */
	toString() {
		return `Error: ${this.message}. Service: ${this.service}. Code: ${this.code} (${this.status}).`;
	}

	/**
	 * Convet error object to json
	 *
	 * @return {Object}
	 */
	toJSON() {
		return {
			code:    this.code,
			status:  this.status,
			service: this.service,
			message: this.message,
		};
	}
}

module.exports = BaseException;
