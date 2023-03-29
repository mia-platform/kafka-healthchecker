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

import { ConsumerCrashEvent } from 'kafkajs'
import { ConsumerState, ProducerState } from './types'

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
  setConsumerCrashStatus(consumerState: ConsumerState, event: ConsumerCrashEvent): void {
    consumerState.status = { healthy: event?.payload?.restart || false, ready: false }
  }

  // producer
  setProducerConnectStatus(producerState: ProducerState): void {
    producerState.status = { healthy: true, ready: true }
  }
  setProducerDisconnectStatus(producerState: ProducerState): void {
    producerState.status = { healthy: false, ready: false }
  }
}
