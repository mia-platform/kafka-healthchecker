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

## Testing locally

#### Create a network connection

```
docker network create app --driver bridge
```

#### Pull the images
```
docker pull bitnami/zookeeper
docker pull bitnami/kafka
```

#### Run the images
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

#### Run tests

```
npm test
```

## Configuration

The library takes in input a list of consumers and producers and a configuration. It adds listeners on all the objects and returns two methods to handle Kafka probes: `isHealthy()` and `isReady()`.

At the moment the library exposes the health checker only for [KafkaJS](https://kafka.js.org/). It is recommended to have read its documentation in case some parameter or configuration is not clear.

Below are reported the configuration and an usage example:

```javascript
configuration = {
  checkStatusForAll: { type: 'boolean', default: true }
}
```

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

const { isHealthy, isReady } = new KafkaHealthChecker([firstConsumer, secondConsumer], [producer], configuration)

async function healthinessHandler() {
  return { statusOK: isHealthy() }
}

async function readinessHandler(service) {
  return { statusOK: isReady() }
}

module.exports.healthinessHandler = healthinessHandler
module.exports.readinessHandler = readinessHandler
```

## Library Methods

#### `isHealthy()`
_isHealthy_ provides the health status of consumers and producers. 

#### `isReady()`
_isReady_ provides the running status of consumers and producers.

[standard-mia-svg]: https://img.shields.io/badge/code_style-standard--mia-orange.svg
[standard-mia]: https://github.com/mia-platform/eslint-config-mia

[coverall-svg]: https://coveralls.io/repos/github/mia-platform/kafka-healthchecker/badge.svg?branch=main
[coverall-io]: https://coveralls.io/github/mia-platform/kafka-healthchecker?branch=main

[github-actions-svg]: https://github.com/mia-platform/flow-manager-client/actions/workflows/node.js.yml/badge.svg
[github-actions]: https://github.com/mia-platform/kafka-healthchecker/actions
