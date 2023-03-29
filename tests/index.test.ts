import Tap from 'tap'
import { Kafka, logLevel, ConsumerCrashEvent } from 'kafkajs'
import { KafkaJSHealthChecker } from '../src/lib/kafkaHealthChecker'
import { ConsumerState, ProducerState } from '../src/lib/types'

Tap.test('Unit tests: ', t => {
  t.test('Kafka HealthChecker test', t => {
    const kafka = new Kafka({
      clientId: 'test',
      brokers: ['test-broker'],
      logLevel: logLevel.ERROR,
    })

    const consumer = kafka.consumer({ groupId: 'test-group-1' })
    const producer = kafka.producer()

    t.test('Status is not healthy nor ready with no consumers and producers', assert => {
      const kafkaHealthChecker = new KafkaJSHealthChecker()
      assert.notOk(kafkaHealthChecker.isHealthy())
      assert.notOk(kafkaHealthChecker.isReady())
      assert.end()
    })

    t.test('Status is healthy and not ready at startup - One consumer, no producers', assert => {
      const kafkaHealthChecker = new KafkaJSHealthChecker([consumer])
      assert.ok(kafkaHealthChecker.isHealthy())
      assert.notOk(kafkaHealthChecker.isReady())
      assert.end()
    })

    t.test('Status is healthy and not ready at startup - One consumer, no producers, with configuration', assert => {
      const configuration = { checkStatusForAll: false }
      const kafkaHealthChecker = new KafkaJSHealthChecker([consumer], [], configuration)
      assert.ok(kafkaHealthChecker.isHealthy())
      assert.notOk(kafkaHealthChecker.isReady())
      assert.end()
    })

    t.test('Status is healthy and not ready at startup - No consumers, one producer', assert => {
      const kafkaHealthChecker = new KafkaJSHealthChecker([], [producer])
      assert.ok(kafkaHealthChecker.isHealthy())
      assert.notOk(kafkaHealthChecker.isReady())
      assert.end()
    })

    t.test('Status is healthy and not ready at startup - No consumers, one producer, with configuration', assert => {
      const configuration = { checkStatusForAll: false }
      const kafkaHealthChecker = new KafkaJSHealthChecker([], [producer], configuration)
      assert.ok(kafkaHealthChecker.isHealthy())
      assert.notOk(kafkaHealthChecker.isReady())
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

    const consumerState = new ConsumerState(consumer)
    const producerState = new ProducerState(producer)

    t.test('Set consumer connect status', assert => {
      consumerState.setConsumerConnectStatus()
      assert.equal(consumerState.getHealthyStatus(), true)
      assert.equal(consumerState.getReadyStatus(), false)
      assert.end()
    })

    t.test('Set consumer group join status', assert => {
      consumerState.setConsumerGroupJoinStatus()
      assert.equal(consumerState.getHealthyStatus(), true)
      assert.equal(consumerState.getReadyStatus(), true)
      assert.end()
    })

    t.test('Set consumer stop status', assert => {
      consumerState.setConsumerStopStatus()
      assert.equal(consumerState.getHealthyStatus(), true)
      assert.equal(consumerState.getReadyStatus(), false)
      assert.end()
    })

    t.test('Set consumer disconnect status', assert => {
      consumerState.setConsumerDisconnectStatus()
      assert.equal(consumerState.getHealthyStatus(), false)
      assert.equal(consumerState.getReadyStatus(), false)
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
      consumerState.setConsumerCrashStatus(event)
      assert.equal(consumerState.getHealthyStatus(), event.payload.restart)
      assert.equal(consumerState.getReadyStatus(), false)
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
      consumerState.setConsumerCrashStatus(event)
      assert.equal(consumerState.getHealthyStatus(), event.payload.restart)
      assert.equal(consumerState.getReadyStatus(), false)
      assert.end()
    })

    t.test('Set producer connect status', assert => {
      producerState.setProducerConnectStatus()
      assert.equal(producerState.getHealthyStatus(), true)
      assert.equal(producerState.getReadyStatus(), true)
      assert.end()
    })

    t.test('Set producer disconnect status', assert => {
      producerState.setProducerDisconnectStatus()
      assert.equal(producerState.getHealthyStatus(), false)
      assert.equal(producerState.getReadyStatus(), false)
      assert.end()
    })

    t.end()
  })

  t.end()
}).then()
