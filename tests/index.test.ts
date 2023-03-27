import Tap from 'tap'
import { Kafka, logLevel } from 'kafkajs'
import { KafkaJSHealthChecker } from '../src/lib/kafkaHealthChecker'
import { ConsumerState, ProducerState } from '../src/lib/types'
import { KafkaJSStatusUpdater } from '../src/lib/statusUpdater'

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

  t.test('Status updater test', t => {
    const kafka = new Kafka({
      clientId: 'test',
      brokers: ['test-broker'],
      logLevel: logLevel.ERROR,
    })

    const consumer = kafka.consumer({ groupId: 'test-group' })
    const producer = kafka.producer()

    const consumerState: ConsumerState = { consumer, status: { healthy: true, ready: false } }
    const producerState: ProducerState = { producer, status: { healthy: true, ready: false } }
    const statusUpdater = new KafkaJSStatusUpdater()

    t.test('Set consumer connect status', assert => {
      statusUpdater.setConsumerConnectStatus(consumerState)
      assert.equal(JSON.stringify(consumerState.status), JSON.stringify({ healthy: true, ready: false }))
      assert.end()
    })

    t.test('Set consumer group join status', assert => {
      statusUpdater.setConsumerGroupJoinStatus(consumerState)
      assert.equal(JSON.stringify(consumerState.status), JSON.stringify({ healthy: true, ready: true }))
      assert.end()
    })

    t.test('Set consumer stop status', assert => {
      statusUpdater.setConsumerStopStatus(consumerState)
      assert.equal(JSON.stringify(consumerState.status), JSON.stringify({ healthy: true, ready: false }))
      assert.end()
    })

    t.test('Set consumer disconnect status', assert => {
      statusUpdater.setConsumerDisconnectStatus(consumerState)
      assert.equal(JSON.stringify(consumerState.status), JSON.stringify({ healthy: false, ready: false }))
      assert.end()
    })

    t.test('Set consumer crash status', assert => {
      const event = {
        payload: {
          restart: true,
        },
      }
      statusUpdater.setConsumerCrashStatus(consumerState, event)
      assert.equal(
        JSON.stringify(consumerState.status),
        JSON.stringify({ healthy: event.payload.restart, ready: false })
      )
      assert.end()
    })

    t.test('Set producer connect status', assert => {
      statusUpdater.setProducerConnectStatus(producerState)
      assert.equal(JSON.stringify(producerState.status), JSON.stringify({ healthy: true, ready: true }))
      assert.end()
    })

    t.test('Set producer disconnect status', assert => {
      statusUpdater.setProducerDisconnectStatus(producerState)
      assert.equal(JSON.stringify(producerState.status), JSON.stringify({ healthy: false, ready: false }))
      assert.end()
    })

    t.end()
  })

  t.end()
}).then()
