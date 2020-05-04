const { INTERNAL_SERVER_ERROR, BAD_REQUEST } = require('http-status');
const statuses                               = require('statuses');
const MjResponse                             = require('./MjResponse');

/**
 * Gateway error response handler
 * Convert response to json RPC 2.0
 *
 * @return {Function}
 * @constructor
 */
const ErrorHandler = env => {
	return (err, req, res, next) => {
		const error = {
			status:  err.status || err.statusCode || INTERNAL_SERVER_ERROR,
			code:    err.code,
			message: err.message,
		};

		if (error.status < BAD_REQUEST) {
			error.status = INTERNAL_SERVER_ERROR;
		}

		if (env !== 'production') {
			error.stack   = err.stack;
			error.name    = statuses.message[error.status];
			error.type    = err.type;
			error.service = err.service;
		}

		res.json(new MjResponse({ id: req?.body?.id, error }));
	};
};

module.exports = ErrorHandler;
