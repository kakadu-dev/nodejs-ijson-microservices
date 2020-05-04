# NodeJS Inverted JSON Microservices

![Node.js Package](https://github.com/kakadu-dev/nodejs-ijson-microservices/workflows/Node.js%20Package/badge.svg)
![Node.js CI](https://github.com/kakadu-dev/nodejs-ijson-microservices/workflows/Node.js%20CI/badge.svg?branch=master)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/kakadu-dev/nodejs-ijson-microservices)

 - Gateway entrypoint
 - Microservice worker 

Example gateway:
```js
const cors        = require('cors');
const { Gateway } = require('@kakadu-dev/nodejs-ijson-microservices');

const IS_DEVELOPMENT = true;

const app = Gateway.create({
	name:  'Project API',
	ijson: process.env.IJSON_HOST,
	port:  process.env.PORT,
	env:   'develoment',
}, gateway => {
	const express = gateway.app;

	// Preflight request
	express.use(cors());

	// express.use(MyAuthentication(gateway));
	// express.use(MyAuthorization(gateway));
}, gateway => {
	const express = gateway.app;

	// express.use(MySpecificErrorHandler());
}, IS_DEVELOPMENT);

app.addInfoRoute();

app.addService('my-service');

app.start();
```

Example microservice:
```js
const { Microservice } = require('@kakadu-dev/nodejs-ijson-microservices');

const IS_DEVELOPMENT = true;

const app = Microservice.create('my-service', {
	ijson: process.env.IJSON_HOST,
	env:   'development',
}, IS_DEVELOPMENT);

const method = () => {
    return {hello: 'world'};
};

app.addEndpoint('test-method', method);

app.start();
```

Start Inverted JSON:
```
version: '3.7'

services:
  ijson:
    image: lega911/ijson
    container_name: base-ijson
    ports:
      - 8001:8001
```

and run POST request to: http://localhost:3000
```json
{
  "id": 1,
  "method": "my-service.test-method",
  "params": {
    "test": 1
  }
}
```
