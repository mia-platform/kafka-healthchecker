import Tap from 'tap'
import { Kafka } from 'kafkajs'
import { KafkaJSHealthChecker } from '../src/lib/kafkaHealthChecker'

Tap.test('Integration tests: ', async t => {
  const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092', 'localhost:9093'],
  })

  const firstConsumer = kafka.consumer({ groupId: 'test-group' })
  const secondConsumer = kafka.consumer({ groupId: 'test-group-2' })
  const producer = kafka.producer()

  await t.test('KafkaJSHealthChecker returns the correct health status with only one consumer', async assert => {
    const healthChecker = new KafkaJSHealthChecker([firstConsumer], [producer])

    assert.ok(healthChecker.isHealthy())
    assert.notOk(healthChecker.isReady())

    await firstConsumer.connect()
    await firstConsumer.subscribe({ topic: 'test-topic', fromBeginning: true })

    await firstConsumer.run({
      eachMessage: async({ message }) => {
        assert.equal(message?.value?.toString(), 'test message')
      },
    })

    assert.ok(healthChecker.isHealthy())
    assert.notOk(healthChecker.isReady())

    await producer.connect()
    await producer.send({
      topic: 'test-topic',
      messages: [
        { value: 'test message' },
      ],
    })

    await producer.send({
      topic: 'test-topic-2',
      messages: [
        { value: 'test message 2' },
      ],
    })

    assert.ok(healthChecker.isHealthy())
    assert.ok(healthChecker.isReady())

    await producer.disconnect()
    await firstConsumer.disconnect()

    assert.notOk(healthChecker.isHealthy())
    assert.notOk(healthChecker.isReady())

    await kafkaTeardown(kafka, ['test-topic', 'test-topic-2'])
    assert.end()
  })

  await t.test('KafkaJSHealthChecker returns the correct health status with two consumers', async assert => {
    const healthChecker = new KafkaJSHealthChecker([firstConsumer, secondConsumer], [producer])

    assert.ok(healthChecker.isHealthy())
    assert.notOk(healthChecker.isReady())

    await firstConsumer.connect()
    await firstConsumer.subscribe({ topic: 'test-topic', fromBeginning: true })

    await firstConsumer.run({
      eachMessage: async({ message }) => {
        assert.equal(message?.value?.toString(), 'test message')
      },
    })

    assert.ok(healthChecker.isHealthy())
    assert.notOk(healthChecker.isReady())

    await secondConsumer.connect()
    await secondConsumer.subscribe({ topic: 'test-topic-2', fromBeginning: true })

    await secondConsumer.run({
      eachMessage: async({ message }) => {
        assert.equal(message?.value?.toString(), 'test message 2')
      },
    })

    await producer.connect()
    await producer.send({
      topic: 'test-topic',
      messages: [
        { value: 'test message' },
      ],
    })

    await producer.send({
      topic: 'test-topic-2',
      messages: [
        { value: 'test message 2' },
      ],
    })

    assert.ok(healthChecker.isHealthy())
    assert.ok(healthChecker.isReady())

    await producer.disconnect()
    await firstConsumer.disconnect()
    await secondConsumer.disconnect()

    assert.notOk(healthChecker.isHealthy())
    assert.notOk(healthChecker.isReady())

    await kafkaTeardown(kafka, ['test-topic'])
    assert.end()
  })

  await t.test('KafkaJSHealthChecker returns the correct health status with two consumers and only one fails with checkStatusForAll false', async assert => {
    const configuration = { checkStatusForAll: false }

    const healthChecker = new KafkaJSHealthChecker([firstConsumer, secondConsumer], [producer], configuration)

    assert.ok(healthChecker.isHealthy())
    assert.notOk(healthChecker.isReady())

    await firstConsumer.connect()
    await firstConsumer.subscribe({ topic: 'test-topic', fromBeginning: true })

    await firstConsumer.run({
      eachMessage: async({ message }) => {
        assert.equal(message?.value?.toString(), 'test message')
      },
    })

    assert.ok(healthChecker.isHealthy())
    assert.notOk(healthChecker.isReady())

    await secondConsumer.connect()
    await secondConsumer.subscribe({ topic: 'test-topic-2', fromBeginning: true })

    await secondConsumer.run({
      eachMessage: async({ message }) => {
        assert.equal(message?.value?.toString(), 'test message 2')
      },
    })

    await producer.connect()
    await producer.send({
      topic: 'test-topic',
      messages: [
        { value: 'test message' },
      ],
    })

    await producer.send({
      topic: 'test-topic-2',
      messages: [
        { value: 'test message 2' },
      ],
    })

    assert.ok(healthChecker.isHealthy())
    assert.ok(healthChecker.isReady())

    await firstConsumer.disconnect()

    assert.ok(healthChecker.isHealthy())
    assert.ok(healthChecker.isReady())

    await secondConsumer.disconnect()
    await producer.disconnect()

    assert.notOk(healthChecker.isHealthy())
    assert.notOk(healthChecker.isReady())

    await kafkaTeardown(kafka, ['test-topic'])
    assert.end()
  })

  t.end()
}).then()

async function kafkaTeardown(kafka: Kafka, topics: string[]) : Promise<void> {
  const admin = kafka.admin()
  await admin.connect()
  await admin.deleteTopics({ topics })
  await admin.disconnect()
}
