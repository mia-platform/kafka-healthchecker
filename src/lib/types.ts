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

import { Consumer, Producer, ConsumerCrashEvent } from 'kafkajs'

export type Status = {
    healthy: boolean,
    ready: boolean
}

export type Configuration = {
    checkStatusForAll: boolean
}

export interface ClientStatus {
    getHealthyStatus(): boolean
    getReadyStatus(): boolean
}

export class KafkaJSConsumer implements ClientStatus {
  private consumer: Consumer
  private status: Status

  constructor(consumer: Consumer) {
    this.consumer = consumer
    this.status = { healthy: true, ready: false }

    this.addListenersToConsumer()
  }

  private addListenersToConsumer() {
    const { CONNECT, GROUP_JOIN, DISCONNECT, CRASH, STOP } = this.consumer.events

    this.consumer.on(CONNECT, () => this.setConsumerConnectStatus())
    this.consumer.on(GROUP_JOIN, () => this.setConsumerGroupJoinStatus())
    this.consumer.on(STOP, () => this.setConsumerStopStatus())
    this.consumer.on(DISCONNECT, () => this.setConsumerDisconnectStatus())
    this.consumer.on(CRASH, (event: any) => this.setConsumerCrashStatus(event))
  }

  setConsumerConnectStatus(): void {
    this.status = { healthy: true, ready: false }
  }
  setConsumerGroupJoinStatus(): void {
    this.status = { healthy: true, ready: true }
  }
  setConsumerStopStatus(): void {
    this.status = { healthy: true, ready: false }
  }
  setConsumerDisconnectStatus(): void {
    this.status = { healthy: false, ready: false }
  }
  setConsumerCrashStatus(event: ConsumerCrashEvent): void {
    this.status = { healthy: event?.payload?.restart || false, ready: false }
  }

  getHealthyStatus(): boolean {
    return this.status.healthy
  }

  getReadyStatus(): boolean {
    return this.status.ready
  }
}

export class KafkaJSProducer implements ClientStatus {
  private producer: Producer
  private status: Status

  constructor(producer: Producer) {
    this.producer = producer
    this.status = { healthy: true, ready: false }

    this.addListenersToProducer()
  }

  private addListenersToProducer() {
    const { CONNECT, DISCONNECT } = this.producer.events

    this.producer.on(CONNECT, () => this.setProducerConnectStatus())
    this.producer.on(DISCONNECT, () => this.setProducerDisconnectStatus())
  }

  setProducerConnectStatus(): void {
    this.status = { healthy: true, ready: true }
  }
  setProducerDisconnectStatus(): void {
    this.status = { healthy: false, ready: false }
  }

  getHealthyStatus(): boolean {
    return this.status.healthy
  }

  getReadyStatus(): boolean {
    return this.status.ready
  }
}
