/*
 *  Copyright 2016, Yahoo Inc.
 *  Licensed under the terms of the Apache License, Version 2.0.
 *  See the LICENSE file associated with the project for terms.
 */
import { tracked } from '@glimmer/tracking';
import { isEqual, isNone } from '@ember/utils';
import { computed, get } from '@ember/object';
import { alias } from '@ember/object/computed';
import Service from '@ember/service';
import SockJS from 'sockjs-client';
import Stomp from '@stomp/stompjs';

const ACK_TYPE = 'ACK';
const COMPLETE_TYPE = 'COMPLETE';
const FAIL_TYPE = 'FAIL';
const NEW_QUERY_TYPE = 'NEW_QUERY';
const SESSION_LENGTH = 64;

export default class StompWebsocketService extends Service {
  @tracked client;

  @alias('settings.queryStompRequestChannel').readOnly() queryStompRequestChannel;
  @alias('settings.queryStompResponseChannel').readOnly() queryStompResponseChannel;

  @computed('client')
  get isConnected() {
    return !isNone(this.client);
  }

  @computed('settings')
  get url() {
    let settings = this.settings;
    return `${get(settings, 'queryHost')}/${get(settings, 'queryNamespace')}/${get(settings, 'queryPath')}`;
  }

  makeStompMessageHandler(stompClient, handlers, context) {
    return payload => {
      let { type, content } = JSON.parse(payload.body);
      if (!isEqual(type, ACK_TYPE)) {
        if (isEqual(type, COMPLETE_TYPE) || isEqual(type, FAIL_TYPE)) {
          this.disconnect();
        }
        handlers.message(JSON.parse(content), context);
      }
    };
  }

  makeStompConnectHandler(stompClient, data, handlers, context) {
    let queryStompRequestChannel = this.queryStompRequestChannel;
    let queryStompResponseChannel = this.queryStompResponseChannel;
    let onStompMessage = this.makeStompMessageHandler(stompClient, handlers, context);
    return () => {
      stompClient.subscribe(queryStompResponseChannel, onStompMessage);
      let request = {
        content: data,
        type: NEW_QUERY_TYPE
      };
      stompClient.send(queryStompRequestChannel, { }, JSON.stringify(request));
      handlers.success(context);
    };
  }

  makeStompErrorHandler(handlers, context) {
    return (...args) => {
      handlers.error(`Error while communicating with the server: ${args}`, context);
    };
  }

  startStompClient(data, handlers, context) {
    let url = this.url;
    let ws = new SockJS(url, [], { sessionId: SESSION_LENGTH });
    let stompClient = Stomp.over(ws);
    stompClient.debug = null;

    let onStompConnect = this.makeStompConnectHandler(stompClient, data, handlers, context);
    let onStompError = this.makeStompErrorHandler(handlers, context);

    this.client = stompClient;
    stompClient.connect({ }, onStompConnect, onStompError);
  }

  disconnect() {
    let client = this.client;
    if (!isNone(client)) {
      client.disconnect();
      this.client = null;
    }
  }
}
