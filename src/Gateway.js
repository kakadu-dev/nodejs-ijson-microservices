const GatewayException = require('./exceptions/GatewayException');
const ConsoleLogDriver = require('./ConsoleLogDriver');
const MjRequest        = require('./MjRequest');
const MjResponse       = require('./MjResponse');
const ErrorHandler     = require('./ErrorHandler');
const express          = require('express');
const mung             = require('express-mung');
const { v4: uuidv4 }   = require('uuid');
const axios            = require('axios');
const bodyParser       = require('body-parser');
const _                = require('lodash');

/**
 * Microservices
 * Gateway
 */
class Gateway
{
	/**
	 * @type {Gateway}
	 */
	static myInstance = null;

	/**
	 * @type {null|Express}
	 *
	 * @private
	 */
	app = null;

	/**
	 * @type {Object}
	 *
	 * @private
	 */
	services = {};

	/**
	 * @type {Object}
	 *
	 * @private
	 */
	options = {
		name:     'Microservice Gateway',
		version:  '1.0.0', // Gateway version
		env:      'development',
		endpoint: '/', // Gateway listen endpoint
		port:     3000, // Gateway port
		ijson:    'http://localhost:8001', // Inverted JSON host + port
	};

	/**
	 * @type {function(msg: string)}
	 *
	 * @private
	 */
	logDriver;

	/**
	 * @constructor
	 *
	 * @param {*} opts
	 */
	constructor(opts) {
		if (opts) {
			throw new Error('Use "create" static method to create gateway.');
		}
	}

	/**
	 * Create gateway instance
	 *
	 * @param {Object} options
	 * @param {function(app: Gateway)} beforeRoute
	 * @param {function(app: Gateway)} afterRoute
	 * @param {function(clb: function, type: number, id: number|string)} logDriver
	 *
	 * @return {Gateway}
	 */
	static create(options = {}, beforeRoute = () => null, afterRoute = () => null, logDriver) {
		if (this.myInstance === null) {
			const instance = new Gateway();

			instance.app       = express();
			instance.options   = { ...instance.options, ..._.pickBy(options) };
			instance.logDriver = logDriver === true
								 ? ConsoleLogDriver // Set default log driver
								 : (
									 // Set custom log driver or dummy
									 logDriver ? logDriver : () => null
								 );

			// Set middleware for json request
			instance.app.use(bodyParser.urlencoded({ extended: true }));
			instance.app.use(bodyParser.json());

			/** LOG REQUEST **/
			instance.app.post('*', (req, res, next) => {
				instance.logDriver(() => `--> Request (${req.body?.id ?? 0}) ` +
										 `from ${req?.body?.params?.payload?.sender ?? 'Client'}: ` +
										 `${JSON.stringify(req.body)}`, 0, req.body?.id ?? 0);
				next();
			});
			instance.app.use(mung.json((body, req, res) => {
				instance.logDriver(() => `<-- Response (${body?.id ?? req?.body?.id ?? 0}): ` +
										 `${body ? JSON.stringify(body) : 'empty (async?)'}.`, 1, req.body?.id ?? 0);
			}, { mungError: true }));
			/** END LOG REQUEST **/

			beforeRoute(instance);

			// Set gateway request listner
			instance.app.route(instance.options.endpoint)
					.post(instance.handleRequest.bind(instance));

			afterRoute(instance);

			// Response format json for errors
			instance.app.use(ErrorHandler(instance.options.env));

			this.myInstance = instance;
		}

		return this.myInstance;
	}

	/**
	 * Get instance
	 *
	 * @return {Gateway}
	 */
	static getInstance() {
		return this.myInstance;
	}

	/**
	 * Handle gateway request
	 *
	 * @param {e.Request} req
	 * @param {e.Response} res
	 *
	 * @return {undefuned}
	 *
	 * @private
	 */
	handleRequest(req, res) {
		const { body: { id, method } } = req;

		// Split service name and service method
		const [service, ...other] = (method || '').split('.');

		// Check microservice
		if (!service || !this.services[service]) {
			res.send(new MjResponse({
				error: new GatewayException({ message: 'Service not found.', status: (!service ? 1 : 2) }),
			}));
			return;
		}

		this.services[service].call(this, req, res, {
			service,
			method: other.join('.'),
		});
	}

	/**
	 * Add info route
	 *
	 * @param {string} endpoint
	 *
	 * @return {Gateway}
	 */
	addInfoRoute(endpoint = '/') {
		this.app.route(endpoint)
			.get((req, res) => res.send(`${this.options.name} Gateway - Available. ` +
										`Version: ${this.options.version}`));

		return this;
	}

	/**
	 * Add new service
	 *
	 * @param {string} name
	 * @param {function(req: e.Request, res: e.Response, method: string)} handler
	 *
	 * @return {Gateway}
	 */
	addService(name, handler = null) {
		this.services[name] = handler || this.serviceHandler;

		return this;
	}

	/**
	 * Service request handler
	 *
	 * @param {e.Request} req
	 * @param {e.Response} res
	 * @param {{ service: string, method: string }} options
	 *
	 * @return {Promise<void>}
	 */
	async serviceHandler(req, res, { service, method }) {
		let response = {};

		try {
			// Set correct sender
			_.set(req, 'body.params.payload.sender', 'Gateway');

			response = (await this.sendClientRequest(service, req, method, false)).data;
		} catch (e) {
			const exception = {
				message: `${e.message} (${service})`,
				status:  3,
			};

			// Microservice not running
			if (e.response && e.response.status === 404) {
				exception.message = `Service "${service}" is down.`;
				exception.status  = 4;
			}

			response.error = new GatewayException(exception);
		}

		res.send(new MjResponse(response));
	}

	/**
	 * Send client request to service
	 *
	 * @param {string} name
	 * @param {e.Request} req
	 * @param {string} method
	 * @param {boolean} autoGenerateId
	 *
	 * @return {Promise.<Object>}
	 */
	sendClientRequest(name, req, method, autoGenerateId = true) {
		const params = _.merge({
			...(autoGenerateId ? { id: uuidv4() } : {}),
			params: {
				payload: { sender: 'Gateway-Inner' },
			},
		}, {
			...req.body,
			method,
		});

		return axios.post(`${this.options.ijson}/${name}`, new MjRequest(params), {
			headers: {
				...(req?.headers?.type ? { type: req.headers.type } : {}),
			},
			timeout: 1000 * 60 * 3, // 3 min
		});
	}

	/**
	 * Get express application
	 *
	 * @return {Express}
	 */
	getExpress() {
		return this.app;
	}

	/**
	 * Start gateway
	 *
	 * @param {function} callback
	 *
	 * @return {undefined}
	 */
	start(callback) {
		const clbck = callback
					  || (({ name, port, version, env }) => console.info(`${name} gateway started on: ` +
																		 `${port} port. Version: ${version} (${env})`));

		this.app.listen(this.options.port, () => clbck(this.options));
	}
}

module.exports = Gateway;
