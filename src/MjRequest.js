/**
 * JSON RPC request class
 */
class MjRequest
{
	/**
	 * @type {null|number}
	 *
	 * @private
	 */
	_id = null;

	/**
	 * @type {string}
	 *
	 * @private
	 */
	_method = null;

	/**
	 * @type {Object}
	 *
	 * @private
	 */
	_params = null;

	/**
	 * @constructor
	 *
	 * @param {Object} props
	 */
	constructor(props = {}) {
		this._id     = props.id || this._id;
		this._method = props.method || this._method;
		this._params = props.params || this._params;
	}

	/**
	 * Get request identity
	 *
	 * @return {number|null}
	 */
	getId() {
		return this._id;
	}

	/**
	 * Get request _method
	 *
	 * @return {string}
	 */
	getMethod() {
		return this._method;
	}

	/**
	 * Get request _params
	 *
	 * @return {*}
	 */
	getParams() {
		return this._params;
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
	 * @return {Object}
	 */
	toJSON() {
		const json = {
			jsonrpc: '2.0',
			...(this._id ? { id: this._id } : {}),
			method:  this._method,
			...(this._params ? { params: this._params } : {}),
		};

		return json;
	}
}

module.exports = MjRequest;
