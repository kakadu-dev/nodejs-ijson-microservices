const colors = require('colors');

/**
 * @constructor
 *
 * @param {boolean} isDebug
 */
const ConsoleLogDriver = (clb, type, id) => {
	let color;

	switch (type) {
		/**
		 * 0 - in
		 * 1 - out
		 */
		case 0:
		case 1:
			color = colors.cyan;
			break;
		/**
		 * 2 - in (internal)
		 * 3 - out (internal)
		 */
		case 2:
		case 3:
			color = colors.blue;
			break;
	}

	console.info(color(clb()));
};

module.exports = ConsoleLogDriver;
