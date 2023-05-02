<div align="center">

# Kafka HealthChecker

[![Build Status][github-actions-svg]][github-actions]
[![javascript style guide][standard-mia-svg]][standard-mia]
[![Coverage Status][coverall-svg]][coverall-io]
[![NPM version][npmjs-svg]][npmjs-com]

</div>

This library helps to handle Kafka healthiness and readiness probes.

## Table of contents
1. [Installation](#installation)
2. [Overview](#overview)
3. [Usage](#usage)
4. [Testing](#testing)
5. [Contributing](#contributing)

## Installation <a name="installation"></a>

```
npm i --save @mia-platform/kafka-healthchecker
```

## Overview <a name="overview"></a>
The library takes in input a list of Kafka *consumers*, a list of Kafka *producers* and a configuration object.

It configures each consumer and producer in order to assign them an internal status that is updated as a result of Kafka events. Then, it exposes two methods:
- `isHealthy()`: returns true if all the consumers and producers are healthy (i.e. they are live)
- `isReady()`: returns true if all the consumers and producers are ready (i.e. they are able to consume and produce messages)

**In order to not lose any events, the library must be initialized before the consumers and the producers are connected to Kafka.**

### Consumer
It follows a table of all the status of the consumers caused by Kafka events. The starting status is `{ healthy: true, ready: false }`.

| Event | Status |
| ----------- | ----------- |
| CONNECT | `{ healthy: true, ready: false }` |
| GROUP_JOIN | `{ healthy: true, ready: true }` |
| STOP   | `{ healthy: true, ready: false }` |
| DISCONNECT | `{ healthy: false, ready: false }` |
| CRASH | `{ healthy: false, ready: false }` |

### Producer
It follows a table of all the status of the producers caused by Kafka events. The starting status is `{ healthy: true, ready: false }`.

| Event | Status |
| ----------- | ----------- |
| CONNECT | `{ healthy: true, ready: false }` |
| DISCONNECT | `{ healthy: false, ready: false }` |

### Configuration
The configuration objects has the following schema:

```javascript
configuration = {
  checkStatusForAll: { type: 'boolean', default: true }
}
```
The `checkStatusForAll` can be:
- `true`: the methods `isHealthy` and `isReady` return true if all the consumers and producers are, respectively, healthy and ready
- `false`: the methods `isHealthy` and `isReady` return true if exists at least one consumer or producer that is, respectively, healthy and ready.

### Notes
At the moment the library exposes the health checker only for [KafkaJS](https://kafka.js.org/). It is recommended to have read its documentation in case some parameter or configuration is not clear.

## Usage <a name="usage"></a>

### Quick start
After the installation, you can import the library, create the `KafkaJSHealthChecker` object passing it one (or more) consumer or producer to get the methods `isHealthy` and `isReady`.

Example:

```javascript
const { Kafka } = require('kafkajs')
const { KafkaHealthChecker } = require('@mia-platform/kafka-healthchecker')

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092', 'localhost:9093'],
})

const consumer = kafka.consumer({ groupId: 'test-group-1' })

const { isHealthy, isReady } = new KafkaJSHealthChecker([consumer])
```

### Advanced
The library takes in input 3 parameters:
- a list of consumers
- a list of producers
- a configuration object to determine if all the consumers and producers have to be considered during the `isHealthy` and `isReady` methods.

Consumers and producers must be passed to the library before their connection to Kafka.

Example:

```javascript
const { Kafka, logLevel } = require('kafkajs')
const { KafkaHealthChecker } = require('@mia-platform/kafka-healthchecker')

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092', 'localhost:9093'],
    logLevel: logLevel.ERROR,
  })

const firstConsumer = kafka.consumer({ groupId: 'test-group-1' })
const secondConsumer = kafka.consumer({ groupId: 'test-group-2' })
const producer = kafka.producer()
const configuration = { checkStatusForAll: true }

const { isHealthy, isReady } = new KafkaJSHealthChecker([firstConsumer, secondConsumer], [producer], configuration)

async function healthinessHandler() {
  return { statusOK: isHealthy() }
}

async function readinessHandler(service) {
  return { statusOK: isReady() }
}

module.exports.healthinessHandler = healthinessHandler
module.exports.readinessHandler = readinessHandler
```

## Testing <a name="testing"></a>

Create a network connection

```
docker network create app --driver bridge
```

Pull the images
```
docker pull bitnami/zookeeper
docker pull bitnami/kafka
```

Run the images
```
docker run -d --rm --name zookeeper --network=app -e ALLOW_ANONYMOUS_LOGIN=yes -p 2180:2181 bitnami/zookeeper

docker run --rm \
  --network app \
  --name=kafka \
  -e KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:2181 \
  -e KAFKA_CFG_ADVERTISED_LISTENERS='PLAINTEXT://127.0.0.1:9092,INTERNAL://localhost:9093' \
  -e KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP='PLAINTEXT:PLAINTEXT,INTERNAL:PLAINTEXT' \
  -e KAFKA_CFG_LISTENERS='PLAINTEXT://0.0.0.0:9092,INTERNAL://0.0.0.0:9093' \
  -e KAFKA_INTER_BROKER_LISTENER_NAME='INTERNAL' \
  -e ALLOW_PLAINTEXT_LISTENER=yes \
  -p 2181:2181 \
  -p 443:9092 \
  -p 9092:9092 \
  -p 9093:9093 \
  bitnami/kafka
```

Run tests
```
npm test
```

## Contributing <a name="contributing"></a>
To contribute to the project, please be mindful for this simple rules:
1. Don’t commit directly on `main`
2. Start your branches with `feature/` or `fix/` based on the content of the branch
3. Always commit in english
4. Once you are happy with your branch, open a [Pull Request][pull-request]

[standard-mia-svg]: https://img.shields.io/badge/code_style-standard--mia-orange.svg
[standard-mia]: https://github.com/mia-platform/eslint-config-mia

[coverall-svg]: https://coveralls.io/repos/github/mia-platform/kafka-healthchecker/badge.svg?branch=main
[coverall-io]: https://coveralls.io/github/mia-platform/kafka-healthchecker?branch=main

[github-actions-svg]: https://github.com/mia-platform/flow-manager-client/actions/workflows/node.js.yml/badge.svg
[github-actions]: https://github.com/mia-platform/kafka-healthchecker/actions

[npmjs-svg]: https://img.shields.io/npm/v/@mia-platform/kafka-healthchecker.svg?logo=npm
[npmjs-com]: https://www.npmjs.com/package/@mia-platform/kafka-healthchecker

[pull-request]: https://github.com/mia-platform/kafka-healthchecker/pulls
