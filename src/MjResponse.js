/**
 * JSON RPC response class
 */
class MjResponse
{
	/**
	 * @type {null|number}
	 *
	 * @private
	 */
	id = null;

	/**
	 * @type {*}
	 *
	 * @private
	 */
	result = null;

	/**
	 * @type {Object|BaseException}
	 *
	 * @private
	 */
	error = null;

	/**
	 * @constructor
	 *
	 * @param {Object} props
	 */
	constructor(props = {}) {
		this.id     = props.id || this.id;
		this.result = props.result || this.result;
		this.error  = props.error || this.error;
	}

	/**
	 * Get response identity
	 *
	 * @return {number|null}
	 */
	getId() {
		return this.id;
	}

	/**
	 * Get response result
	 *
	 * @return {*}
	 */
	getResult() {
		return this.result;
	}

	/**
	 * Get response error
	 *
	 * @return {Object|BaseException}
	 */
	getError() {
		return this.error;
	}

	/**
	 * Convert object to json string
	 *
	 * @return {string}
	 */
	toString() {
		return JSON.stringify(this.toJSON());
	}

	/**
	 * Convet object to json
	 *
	 * @return {Object|undefined}
	 */
	toJSON() {
		const json = {
			jsonrpc: '2.0',
			...(this.id ? { id: this.id } : {}),
			...(this.result ? { result: this.result } : {}),
			...(this.error ? { error: this.error } : {}),
		};

		// Notification response
		if (!json.result && !json.error) {
			return;
		}

		return json;
	}
}

module.exports = MjResponse;
