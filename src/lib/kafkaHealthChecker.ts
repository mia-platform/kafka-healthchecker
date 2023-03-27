/*
 * Copyright 2022 Mia srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Consumer, Producer } from 'kafkajs'

type Status = {
    healthy: boolean,
    ready: boolean
}

export type ConsumerState = {
    consumer: Consumer,
    status: Status
}

export type ProducerState = {
    producer: Producer,
    status: Status
}

type Configuration = {
  checkStatusForAll: boolean
}

export class KafkaJSStatusUpdater {
  // consumer
  setConsumerConnectStatus(consumerState: ConsumerState): void {
    consumerState.status = { healthy: true, ready: false }
  }
  setConsumerGroupJoinStatus(consumerState: ConsumerState): void {
    consumerState.status = { healthy: true, ready: true }
  }
  setConsumerStopStatus(consumerState: ConsumerState): void {
    consumerState.status = { healthy: true, ready: false }
  }
  setConsumerDisconnectStatus(consumerState: ConsumerState): void {
    consumerState.status = { healthy: false, ready: false }
  }
  setConsumerCrashStatus(consumerState: ConsumerState, event: any): void {
    consumerState.status = { healthy: event.payload.restart, ready: false }
  }

  // producer
  setProducerConnectStatus(producerState: ProducerState): void {
    producerState.status = { healthy: true, ready: true }
  }
  setProducerDisconnectStatus(producerState: ProducerState): void {
    producerState.status = { healthy: false, ready: false }
  }
}

interface KafkaHealthChecker {
  isHealthy() : boolean
  isReady() : boolean
}

export class KafkaJSHealthChecker implements KafkaHealthChecker {
  private simpleConsumers: ConsumerState[] = []
  private simpleProducers: ProducerState[] = []
  private configuration: Configuration = { checkStatusForAll: true }
  private statusUpdater = new KafkaJSStatusUpdater()

  constructor(
    consumers?: Consumer[] | undefined,
    producers?: Producer[] | undefined,
    configuration?: Configuration | undefined | null
  ) {
    if (configuration) {
      this.configuration = configuration
    }
    if (consumers) {
      consumers.forEach(consumer => {
        const simpleConsumer = this.configureConsumer(consumer)
        this.simpleConsumers.push(simpleConsumer)
      })
    }

    if (producers) {
      producers.forEach(producer => {
        const simpleProducer = this.configureProducer(producer)
        this.simpleProducers.push(simpleProducer)
      })
    }
  }

  isHealthy(): boolean {
    if ((this.simpleConsumers.length + this.simpleProducers.length) <= 0) {
      return false
    }

    if (this.configuration.checkStatusForAll) {
      return this.areAllConsumersAndProducersHealthy()
    }
    return this.atLeastOneConsumerOrProducerIsHealthy()
  }

  isReady(): boolean {
    if ((this.simpleConsumers.length + this.simpleProducers.length) <= 0) {
      return false
    }

    if (this.configuration.checkStatusForAll) {
      return this.areAllConsumersAndProducersReady()
    }
    return this.atLeastOneConsumerOrProducerIsReady()
  }

  private configureConsumer(consumer: Consumer) : ConsumerState {
    const consumerState: ConsumerState = { consumer, status: { healthy: true, ready: false } }
    const { CONNECT, GROUP_JOIN, DISCONNECT, CRASH, STOP } = consumer.events

    consumerState.consumer.on(CONNECT, () => this.statusUpdater.setConsumerConnectStatus(consumerState))
    consumerState.consumer.on(GROUP_JOIN, () => this.statusUpdater.setConsumerGroupJoinStatus(consumerState))
    consumerState.consumer.on(STOP, () => this.statusUpdater.setConsumerStopStatus(consumerState))
    consumerState.consumer.on(DISCONNECT, () => this.statusUpdater.setConsumerDisconnectStatus(consumerState))
    consumerState.consumer.on(CRASH, (event: any) => this.statusUpdater.setConsumerCrashStatus(consumerState, event))

    return consumerState
  }

  private configureProducer(producer: Producer) : ProducerState {
    const producerState: ProducerState = { producer, status: { healthy: true, ready: false } }
    const { CONNECT, DISCONNECT } = producer.events

    producerState.producer.on(CONNECT, () => this.statusUpdater.setProducerConnectStatus(producerState))
    producerState.producer.on(DISCONNECT, () => this.statusUpdater.setProducerDisconnectStatus(producerState))

    return producerState
  }

  private atLeastOneConsumerOrProducerIsHealthy(): boolean {
    return Object.values(this.simpleConsumers).some(consumer => consumer.status.healthy)
      || Object.values(this.simpleProducers).some(producer => producer.status.healthy)
  }

  private areAllConsumersAndProducersHealthy(): boolean {
    return Object.values(this.simpleConsumers).every(consumer => consumer.status.healthy)
      && Object.values(this.simpleProducers).every(producer => producer.status.healthy)
  }

  private atLeastOneConsumerOrProducerIsReady(): boolean {
    return Object.values(this.simpleConsumers).some(consumer => consumer.status.ready)
      || Object.values(this.simpleProducers).some(producer => producer.status.ready)
  }

  private areAllConsumersAndProducersReady(): boolean {
    return Object.values(this.simpleConsumers).every(consumer => consumer.status.ready)
      && Object.values(this.simpleProducers).every(producer => producer.status.ready)
  }
}
