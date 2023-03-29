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
import { ClientState, ConsumerState, ProducerState, Configuration } from './types'

interface KafkaHealthChecker {
  isHealthy() : boolean
  isReady() : boolean
}

export class KafkaJSHealthChecker implements KafkaHealthChecker {
  private states: ClientState[] = []
  private configuration: Configuration = { checkStatusForAll: true }

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
        const consumerState = this.addListenersToConsumer(consumer)
        this.states.push(consumerState)
      })
    }

    if (producers) {
      producers.forEach(producer => {
        const producerState = this.addListenersToProducer(producer)
        this.states.push(producerState)
      })
    }
  }

  isHealthy(): boolean {
    if (this.states.length <= 0) {
      return false
    }

    if (this.configuration.checkStatusForAll) {
      return this.areAllConsumersAndProducersHealthy()
    }
    return this.atLeastOneConsumerOrProducerIsHealthy()
  }

  isReady(): boolean {
    if (this.states.length <= 0) {
      return false
    }

    if (this.configuration.checkStatusForAll) {
      return this.areAllConsumersAndProducersReady()
    }
    return this.atLeastOneConsumerOrProducerIsReady()
  }

  private addListenersToConsumer(consumer: Consumer) : ClientState {
    const { CONNECT, GROUP_JOIN, DISCONNECT, CRASH, STOP } = consumer.events
    const consumerState = new ConsumerState(consumer)

    consumer.on(CONNECT, () => consumerState.setConsumerConnectStatus())
    consumer.on(GROUP_JOIN, () => consumerState.setConsumerGroupJoinStatus())
    consumer.on(STOP, () => consumerState.setConsumerStopStatus())
    consumer.on(DISCONNECT, () => consumerState.setConsumerDisconnectStatus())
    consumer.on(CRASH, (event: any) => consumerState.setConsumerCrashStatus(event))

    return consumerState
  }

  private addListenersToProducer(producer: Producer) : ProducerState {
    const { CONNECT, DISCONNECT } = producer.events
    const producerState = new ProducerState(producer)

    producer.on(CONNECT, () => producerState.setProducerConnectStatus())
    producer.on(DISCONNECT, () => producerState.setProducerDisconnectStatus())

    return producerState
  }

  private atLeastOneConsumerOrProducerIsHealthy(): boolean {
    return Object.values(this.states).some(state => state.getHealthyStatus())
  }

  private areAllConsumersAndProducersHealthy(): boolean {
    return Object.values(this.states).every(state => state.getHealthyStatus())
  }

  private atLeastOneConsumerOrProducerIsReady(): boolean {
    return Object.values(this.states).some(state => state.getReadyStatus())
  }

  private areAllConsumersAndProducersReady(): boolean {
    return Object.values(this.states).every(state => state.getReadyStatus())
  }
}
