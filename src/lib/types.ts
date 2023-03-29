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

export interface ClientState {
    getHealthyStatus(): boolean
    getReadyStatus(): boolean
}

export class ConsumerState implements ClientState {
  private consumer: Consumer
  private status: Status

  constructor(consumer: Consumer) {
    this.consumer = consumer
    this.status = { healthy: true, ready: false }
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

export class ProducerState implements ClientState {
  private producer: Producer
  private status: Status

  constructor(producer: Producer) {
    this.producer = producer
    this.status = { healthy: true, ready: false }
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
