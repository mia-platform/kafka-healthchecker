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
import { ClientStatus, KafkaJSConsumer, KafkaJSProducer, Configuration } from './types'

interface KafkaHealthChecker {
  isHealthy() : boolean
  isReady() : boolean
}

export class KafkaJSHealthChecker implements KafkaHealthChecker {
  private states: ClientStatus[] = []
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
        this.states.push(new KafkaJSConsumer(consumer))
      })
    }

    if (producers) {
      producers.forEach(producer => {
        this.states.push(new KafkaJSProducer(producer))
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
