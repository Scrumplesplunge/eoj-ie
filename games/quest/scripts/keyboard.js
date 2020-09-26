// A keyboard takes keydown and keyup events from an eventmanager and keeps
// track of which keys are held.
class Keyboard extends EventManager {
  constructor(eventManager) {
    eventManager.on("keydown", event => this.onKeyDown(event));
    eventManager.on("keyup", event => this.onKeyUp(event));
    super("keyboard");
    this.keys = {};
  }
  onKeyDown(event) {
    if (this.key(event.key)) return;
    this.keys[event.key] = true;
    this.trigger(event);
  }
  onKeyUp(event) {
    if (!this.key(event.key)) return;
    delete this.keys[event.key];
    this.trigger(event);
  }
  key(name) { return this.keys.hasOwnProperty(event.key); }
}
