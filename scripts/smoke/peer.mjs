/* global setTimeout, clearTimeout */
import { WebSocket } from 'ws';

export class Peer {
  messages = [];
  waiters = [];

  constructor(url, origin) {
    this.socket = new WebSocket(url, { origin });
    this.socket.on('message', (bytes) => {
      const message = JSON.parse(bytes.toString());
      const waiter = this.waiters.find((item) => item.test(message));
      if (!waiter) {
        this.messages.push(message);
        return;
      }
      this.waiters.splice(this.waiters.indexOf(waiter), 1);
      clearTimeout(waiter.timer);
      waiter.resolve(message);
    });
  }
  send(event, data = {}) {
    this.socket.send(JSON.stringify({ event, data }));
  }
  next(test) {
    const index = this.messages.findIndex(test);
    if (index >= 0) return Promise.resolve(this.messages.splice(index, 1)[0]);
    return new Promise((resolve, reject) => {
      const waiter = {
        test,
        resolve,
        timer: setTimeout(() => reject(new Error('Timed out waiting for WebSocket state')), 5000),
      };
      this.waiters.push(waiter);
    });
  }
  state(test) {
    return this.next(
      (message) => ['game_state', 'room_state'].includes(message.event) && test(message.data),
    );
  }
}
