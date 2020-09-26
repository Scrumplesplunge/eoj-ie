// The EventManager class allows arbitrary event handlers to be registered, and
// arbitrary events to be thrown.
class EventManager {
  constructor() {
    this.eventTypes = {};
  }

  // Register a callback for events of the given type.
  on(type, callback) {
    if (!this.eventTypes.hasOwnProperty(type)) {
      this.eventTypes[type] = [];
    }
    this.eventTypes[type].push(callback);
  }

  // Trigger an event. Event objects must have a "type" property that matches
  // the type string of the callbacks that they should invoke.
  trigger(event) {
    if (!this.eventTypes.hasOwnProperty(event.type)) return;
    var callbacks = this.eventTypes[event.type];
    callbacks.forEach(callback => callback(event));
  }
}
