import Tap from 'tap'
import { Kafka, logLevel, ConsumerCrashEvent } from 'kafkajs'
import { KafkaJSHealthChecker } from '../src/index'
import { KafkaJSConsumer, KafkaJSProducer } from '../src/lib/types'

Tap.test('Unit tests: ', t => {
  t.test('Kafka HealthChecker test', t => {
    const kafka = new Kafka({
      clientId: 'test',
      brokers: ['test-broker'],
      logLevel: logLevel.ERROR,
    })

    const consumer = kafka.consumer({ groupId: 'test-group-1' })
    const producer = kafka.producer()

    t.test('Status is not healthy nor ready with no consumers and producers - use constructor', assert => {
      const kafkaHealthChecker = new KafkaJSHealthChecker()
      assert.notOk(kafkaHealthChecker.isHealthy())
      assert.notOk(kafkaHealthChecker.isReady())
      assert.end()
    })

    t.test('Status is not healthy nor ready with no consumers and producers - use constructor', assert => {
      const { isHealthy, isReady } = new KafkaJSHealthChecker()
      assert.notOk(isHealthy())
      assert.notOk(isReady())
      assert.end()
    })

    t.test('Status is healthy and not ready at startup - One consumer, no producers - use constructor', assert => {
      const kafkaHealthChecker = new KafkaJSHealthChecker([consumer])
      assert.ok(kafkaHealthChecker.isHealthy())
      assert.notOk(kafkaHealthChecker.isReady())
      assert.end()
    })

    t.test('Status is healthy and not ready at startup - One consumer, no producers - use constructor', assert => {
      const { isHealthy, isReady } = new KafkaJSHealthChecker([consumer])
      assert.ok(isHealthy())
      assert.notOk(isReady())
      assert.end()
    })

    t.test('Status is healthy and not ready at startup - One consumer, no producers, with configuration - use constructor', assert => {
      const configuration = { checkStatusForAll: false }
      const kafkaHealthChecker = new KafkaJSHealthChecker([consumer], [], configuration)
      assert.ok(kafkaHealthChecker.isHealthy())
      assert.notOk(kafkaHealthChecker.isReady())
      assert.end()
    })

    t.test('Status is healthy and not ready at startup - One consumer, no producers, with configuration - use constructor', assert => {
      const configuration = { checkStatusForAll: false }
      const { isHealthy, isReady } = new KafkaJSHealthChecker([consumer], [], configuration)
      assert.ok(isHealthy())
      assert.notOk(isReady())
      assert.end()
    })

    t.test('Status is healthy and not ready at startup - No consumers, one producer - use constructor', assert => {
      const kafkaHealthChecker = new KafkaJSHealthChecker([], [producer])
      assert.ok(kafkaHealthChecker.isHealthy())
      assert.notOk(kafkaHealthChecker.isReady())
      assert.end()
    })

    t.test('Status is healthy and not ready at startup - No consumers, one producer - use constructor', assert => {
      const { isHealthy, isReady } = new KafkaJSHealthChecker([], [producer])
      assert.ok(isHealthy())
      assert.notOk(isReady())
      assert.end()
    })

    t.test('Status is healthy and not ready at startup - No consumers, one producer, with configuration - use constructor', assert => {
      const configuration = { checkStatusForAll: false }
      const kafkaHealthChecker = new KafkaJSHealthChecker([], [producer], configuration)
      assert.ok(kafkaHealthChecker.isHealthy())
      assert.notOk(kafkaHealthChecker.isReady())
      assert.end()
    })

    t.test('Status is healthy and not ready at startup - No consumers, one producer, with configuration - use constructor', assert => {
      const configuration = { checkStatusForAll: false }
      const { isHealthy, isReady } = new KafkaJSHealthChecker([], [producer], configuration)
      assert.ok(isHealthy())
      assert.notOk(isReady())
      assert.end()
    })

    t.end()
  })

  t.test('Status update test ', t => {
    const kafka = new Kafka({
      clientId: 'test',
      brokers: ['test-broker'],
      logLevel: logLevel.ERROR,
    })

    const consumer = kafka.consumer({ groupId: 'test-group' })
    const producer = kafka.producer()

    const kafkaConsumer = new KafkaJSConsumer(consumer)
    const kafkaProducer = new KafkaJSProducer(producer)

    t.test('Set consumer connect status', assert => {
      kafkaConsumer.setConsumerConnectStatus()
      assert.equal(kafkaConsumer.getHealthyStatus(), true)
      assert.equal(kafkaConsumer.getReadyStatus(), false)
      assert.end()
    })

    t.test('Set consumer group join status', assert => {
      kafkaConsumer.setConsumerGroupJoinStatus()
      assert.equal(kafkaConsumer.getHealthyStatus(), true)
      assert.equal(kafkaConsumer.getReadyStatus(), true)
      assert.end()
    })

    t.test('Set consumer stop status', assert => {
      kafkaConsumer.setConsumerStopStatus()
      assert.equal(kafkaConsumer.getHealthyStatus(), true)
      assert.equal(kafkaConsumer.getReadyStatus(), false)
      assert.end()
    })

    t.test('Set consumer disconnect status', assert => {
      kafkaConsumer.setConsumerDisconnectStatus()
      assert.equal(kafkaConsumer.getHealthyStatus(), false)
      assert.equal(kafkaConsumer.getReadyStatus(), false)
      assert.end()
    })

    t.test('Set consumer crash status - event has restart true', assert => {
      const event : ConsumerCrashEvent = {
        type: 'CRASH',
        payload: {
          groupId: 'test-group',
          restart: true,
          error: new Error('Consumer crashed'),
        },
        id: 'test-id',
        timestamp: 1680074273,
      }
      kafkaConsumer.setConsumerCrashStatus(event)
      assert.equal(kafkaConsumer.getHealthyStatus(), event.payload.restart)
      assert.equal(kafkaConsumer.getReadyStatus(), false)
      assert.end()
    })

    t.test('Set consumer crash status - event has restart false', assert => {
      const event : ConsumerCrashEvent = {
        type: 'CRASH',
        payload: {
          groupId: 'test-group',
          restart: false,
          error: new Error('Consumer crashed'),
        },
        id: 'test-id',
        timestamp: 1680074273,
      }
      kafkaConsumer.setConsumerCrashStatus(event)
      assert.equal(kafkaConsumer.getHealthyStatus(), event.payload.restart)
      assert.equal(kafkaConsumer.getReadyStatus(), false)
      assert.end()
    })

    t.test('Set producer connect status', assert => {
      kafkaProducer.setProducerConnectStatus()
      assert.equal(kafkaProducer.getHealthyStatus(), true)
      assert.equal(kafkaProducer.getReadyStatus(), true)
      assert.end()
    })

    t.test('Set producer disconnect status', assert => {
      kafkaProducer.setProducerDisconnectStatus()
      assert.equal(kafkaProducer.getHealthyStatus(), false)
      assert.equal(kafkaProducer.getReadyStatus(), false)
      assert.end()
    })

    t.end()
  })

  t.end()
}).then()
