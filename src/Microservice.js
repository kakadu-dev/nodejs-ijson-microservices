const MicroserviceException = require('./exceptions/MicroserviceException');
const ConsoleLogDriver      = require('./ConsoleLogDriver');
const MjRequest             = require('./MjRequest');
const MjResponse            = require('./MjResponse');
const ExpandSrv             = require('./helpers/ExpandSrv');
const axios                 = require('axios');
const http                  = require('http');
const { v4: uuidv4 }        = require('uuid');
const _                     = require('lodash');

/**
 * Microservice class
 */
class Microservice
{
	/**
	 * @type {Microservice}
	 */
	static myInstance = null;

	/**
	 * @type {null|string} microservice name
	 *
	 * @private
	 */
	name = null;

	/**
	 * @type {Object}
	 *
	 * @private
	 */
	options = {
		version:        '1.0.0', // Microservice version
		env:            'production',
		ijson:          'http://localhost:8001', // Inverted JSON host + port
		requestTimeout: 1000 * 60 * 5, // 5 min
	};

	/**
	 * @type {boolean} srv ijson expanded
	 */
	srvExpand = false;

	/**
	 * @type {Object}
	 *
	 * @private
	 */
	endpoints = {};

	/**
	 * @type {http.Agent}
	 *
	 * @private
	 */
	httpAgent = null;

	/**
	 * @type {Array.<function>}
	 *
	 * @private
	 */
	middleware = [];

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
			throw new Error('Use "create" static method to create service.');
		}
	}

	/**
	 * Create service instance
	 *
	 * @param {string} name
	 * @param {Object} options
	 * @param {function(clb: function)|boolean} logDriver
	 *
	 * @return {Microservice}
	 */
	static create(name, options = {}, logDriver) {
		if (this.myInstance === null) {
			const instance = new Microservice();

			instance.name      = name;
			instance.options   = { ...instance.options, ..._.pickBy(options) };
			instance.httpAgent = new http.Agent({ keepAlive: true });
			instance.logDriver = logDriver === true
								 ? ConsoleLogDriver // Set default log driver
								 : (
									 // Set custom log driver or dummy
									 logDriver ? logDriver : () => null
								 );

			// Set original service name for exceptions
			MicroserviceException.service = name;

			this.myInstance = instance;
		}

		return this.myInstance;
	}

	/**
	 * Get instance
	 *
	 * @return {Microservice}
	 */
	static getInstance() {
		return this.myInstance;
	}

	/**
	 * Add microservice endpoint
	 *
	 * @param {string} path
	 * @param {function} handler
	 *
	 * @return Microservice
	 */
	addEndpoint(path, handler) {
		this.endpoints[path] = handler;

		return this;
	}

	/**
	 * Add request middleware
	 *
	 * @param {function(newData: Object, data: Object, req: Object)} middleware
	 *
	 * @return {Microservice}
	 */
	addMiddleware(middleware) {
		this.middleware.push(middleware);

		return this;
	}

	/**
	 * Get ijson host
	 *
	 * @return {Promise<string>}
	 */
	async getIjsonHost() {
		if (!this.srvExpand) {
			this.options.ijson = await ExpandSrv(this.options.ijson);
			this.srvExpand     = true;
		}

		return this.options.ijson;
	}

	/**
	 * Send request to service
	 *
	 * @param {string} method
	 * @param {Object|undefined} data
	 * @param {boolean} autoGenerateId
	 * @param {Object} requestConfig
	 *
	 * @return {Promise<MjResponse>}
	 */
	async sendServiceRequest(method, data, autoGenerateId = true, requestConfig = {}) {
		const [service, ...other] = method.split('.');

		const request = new MjRequest(_.merge({
			...(autoGenerateId ? { id: uuidv4() } : {}),
			method: other.join('.'),
			params: data,
		}, {
			params: {
				payload: { sender: `${this.name} (srv)` },
			},
		}));

		let response   = {};
		const time     = Date.now();
		const jsonHost = await this.getIjsonHost();

		try {
			this.logDriver(() => `    --> Request (${service} - ${request.getId()}): ${JSON.stringify(request)}`, 2, request.getId());

			response = (await axios.post(`${jsonHost}/${service}`, request, {
				timeout: this.options.requestTimeout,
				...requestConfig,
			})).data;

			if (response.error) {
				throw new MicroserviceException(response.error);
			}

			return new MjResponse({
				id: request.id,
				...(response?.result ? { result: response.result } : {}),
			});
		} catch (e) {
			if (e instanceof MicroserviceException) {
				throw e;
			}

			const exception = {
				message: e.message,
				status:  4,
			};

			// Microservice not running
			if (e.response && e.response.status === 404) {
				exception.message = `Service "${service}" is down.`;
				exception.status  = 5;
			}

			throw new MicroserviceException(exception);
		} finally {
			const reqTime = Date.now() - time;
			this.logDriver(() => `    <-- Response (${service} - ${request.getId()}) ${reqTime} ms: ` +
								 `${response ? JSON.stringify(response) : 'empty (async?)'}.`, 3, request.getId());
		}
	}

	/**
	 * Add middleware to request params
	 *
	 * @param {Object} data
	 * @param {Object} request
	 *
	 * @return {Promise<Object>}
	 */
	async handleMiddleware(data, request) {
		let newData = { ...data };

		if (this.middleware.length) {
			for (const mdl of this.middleware) {
				await mdl(newData, data, request);
			}
		}

		return newData;
	}

	/**
	 * Get request time
	 *
	 * @param {Object} req
	 *
	 * @return {number}
	 * @private
	 */
	_getReqTime = req => {
		return Date.now() - req?.time;
	};

	/**
	 * Get client request
	 *
	 * @param {boolean} isFirstTask
	 * @param {Object} response previous task response
	 *
	 * @return {Promise.<Object>}
	 *
	 * @private
	 */
	async handleClientRequest(isFirstTask = true, response) {
		try {
			const resp = await axios.request({
				url:       isFirstTask ? `/${this.name}` : null,
				baseURL:   await this.getIjsonHost(),
				method:    'post',
				data:      response,
				httpAgent: this.httpAgent,
				headers:   {
					type: 'worker',
				},
			});

			this.logDriver(() => `--> Request (${resp?.data?.id ?? 0})` +
								 ` from ${resp?.data?.params?.payload?.sender ?? 'Client'}: ` +
								 `${JSON.stringify(resp.data)}`, 0, resp?.data?.id ?? 0);
			resp.time = Date.now();

			return resp;
		} catch (e) {
			if (e.message === 'socket hang up') {
				throw e;
			}

			return new MicroserviceException({
				message: e.message,
			});
		}
	}

	/**
	 * Start microservice
	 *
	 * @param {function} callback
	 *
	 * @return {undefined}
	 */
	async start(callback) {
		const clbck = callback
					  || (({ version, env }) => console.info(`${this.name} microservice started. ` +
															 `Version: ${version} (${env})`));

		clbck(this.options);

		let request;
		let response;

		request = await this.handleClientRequest();

		if (request instanceof MicroserviceException) {
			this.logDriver(() => `<-- Response (${request?.data?.id ?? 0}) ${this._getReqTime(request)} ms: ` +
								 `${JSON.stringify(request)}`, 1, request?.data?.id ?? 0);
			throw new Error(request.message);
		}

		while (true) {
			response = {
				...(request?.data?.id ? { id: request.data.id } : {}),
			};

			if (request instanceof MicroserviceException) {
				response.error = request;
			} else {
				const { data } = request;
				const handler  = this.endpoints[data.method];

				if (handler) {
					try {
						const params = await this.handleMiddleware(data.params, request);

						response.result = await handler(params, { app: this, request });
					} catch (e) {
						console.info(e.stack);
						response.error = new MicroserviceException({
							message: `Endpoint exception (${data.method}): ${e.message}`,
							code:    e?.code ?? null,
							status:  e?.status ?? 2,
							payload: e?.payload ?? null,
						});
					}
				} else {
					response.error = new MicroserviceException({
						message: `Unknown method: ${data.method}`,
						status:  1,
					});
				}
			}

			const rsp = new MjResponse(response);

			this.logDriver(() => `<-- Response (${rsp.getId() ?? 0}) ${this._getReqTime(request)} ms: ` +
								 `${JSON.stringify(rsp)}`, 1, rsp.getId());

			request = await this.handleClientRequest(false, new MjResponse(rsp));
		}
	}
}

module.exports = Microservice;
