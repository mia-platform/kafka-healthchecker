<div align="center">

# Kafka HealthChecker

[![Build Status][github-actions-svg]][github-actions]
[![javascript style guide][standard-mia-svg]][standard-mia]
[![Coverage Status][coverall-svg]][coverall-io]

</div>

This library helps to handle Kafka healthiness and readiness probes.

## Installation

```
npm i --save @mia-platform/kafka-healthchecker
```

## Description
The library takes in input a list of Kafka *consumers*, a list of Kafka *producers* and a configuration object.

It configures each consumer and producer in order to assign them an internal status that is updated as a result of Kafka events. Then, it exposes two methods:
- `isHealthy()`: returns true if all the consumers and producers are healthy (i.e. they are live)
- `isReady()`: returns true if all the consumers and producers are ready (i.e. they are able to consume and produce messages)

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

## Usage

### Quick start
After the insallation
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

The library takes in input a list of consumers and producers and a configuration. It adds listeners on all the objects and returns two methods to handle Kafka probes: `isHealthy()` and `isReady()`.

At the moment the library exposes the health checker only for [KafkaJS](https://kafka.js.org/). It is recommended to have read its documentation in case some parameter or configuration is not clear.

Below are reported the configuration and an usage example:

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

## Testing locally

#### Create a network connection

```
docker network create app --driver bridge
```

#### Run the image
```
docker run -d --name=kafka --rm --network app -p 8081:8081 -p 8082:8082 -p 9092:9092 -p 9644:9644 docker.redpanda.com/vectorized/redpanda:latest redpanda start --overprovisioned --smp 1  --memory 1G --reserve-memory 0M --node-id 0 --check=false
```

#### Run tests

```
npm test
```

## Contributing
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

[pull-request]: https://github.com/mia-platform/kafka-healthchecker/pulls