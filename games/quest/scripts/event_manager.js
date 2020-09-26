// An EventManager is something which can receive events and can be instructed
// to perform certain actions in response to them.
//
// Example:
//
// var eventManager = new EventManager;
// eventManager.on("foo", () => console.log("foo!"));
// eventManager.trigger({type: "foo"});  // logs "foo!"
class EventManager {
  constructor(name) {
    this.name = name || "<unnamed>";
    this.eventHandlers = {};
  }
  on(type, handler) {
    if (!this.eventHandlers.hasOwnProperty(type))
      this.eventHandlers[type] = [];
    this.eventHandlers[type].push(handler);
  }
  trigger(event) {
    // Silently ignore events which do not have any handlers.
    if (!this.eventHandlers.hasOwnProperty(event.type)) return;
    var handlers = this.eventHandlers[event.type];
    for (var i = 0, n = handlers.length; i < n; i++) {
      handlers[i](event);
    }
  }
}
