import Tap from 'tap'
import { Kafka } from 'kafkajs'
import { ConsumerState, ProducerState, KafkaJSStatusUpdater } from '../src/lib/kafkaHealthChecker'

Tap.test('Unit tests: ', async t => {
  await t.test('Status updater test', async t => {
    const kafka = new Kafka({
      clientId: 'test',
      brokers: ['kafka1:9092', 'kafka2:9092'],
    })

    const consumer = kafka.consumer({ groupId: 'test-group' })
    const producer = kafka.producer()

    const consumerState: ConsumerState = { consumer, status: { healthy: true, ready: false } }
    const producerState: ProducerState = { producer, status: { healthy: true, ready: false } }
    const statusUpdater = new KafkaJSStatusUpdater()

    await t.test('Set consumer connect status', async assert => {
      statusUpdater.setConsumerConnectStatus(consumerState)
      assert.equal(JSON.stringify(consumerState.status), JSON.stringify({ healthy: true, ready: false }))
      assert.end()
    })

    await t.test('Set consumer group join status', async assert => {
      statusUpdater.setConsumerGroupJoinStatus(consumerState)
      assert.equal(JSON.stringify(consumerState.status), JSON.stringify({ healthy: true, ready: true }))
      assert.end()
    })

    await t.test('Set consumer stop status', async assert => {
      statusUpdater.setConsumerStopStatus(consumerState)
      assert.equal(JSON.stringify(consumerState.status), JSON.stringify({ healthy: true, ready: false }))
      assert.end()
    })

    await t.test('Set consumer disconnect status', async assert => {
      statusUpdater.setConsumerDisconnectStatus(consumerState)
      assert.equal(JSON.stringify(consumerState.status), JSON.stringify({ healthy: false, ready: false }))
      assert.end()
    })

    await t.test('Set consumer crash status', async assert => {
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

    await t.test('Set producer connect status', async assert => {
      statusUpdater.setProducerConnectStatus(producerState)
      assert.equal(JSON.stringify(producerState.status), JSON.stringify({ healthy: true, ready: true }))
      assert.end()
    })

    await t.test('Set producer disconnect status', async assert => {
      statusUpdater.setProducerDisconnectStatus(producerState)
      assert.equal(JSON.stringify(producerState.status), JSON.stringify({ healthy: false, ready: false }))
      assert.end()
    })

    t.end()
  })

  t.end()
}).then()
