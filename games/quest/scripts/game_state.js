// The GameState allows context switching between several event managers. This
// allows the game to transition between many different execution modes, such as
// menus and gameplay.
class GameState {
  constructor(startState) {
    if (!startState) throw Error("GameState requires a startState.");
    this.globalEventManager = new EventManager("global");
    this.currentState = startState;
  }
  on(type, handler) {
    this.globalEventManager.on(type, handler);
  }
  switchTo(newState) {
    console.log("Switching from " + this.currentState.name + " to " +
                newState.name);
    this.currentState.trigger({type: "leave", to: newState});
    var oldState = this.currentState;
    this.currentState = newState;
    this.currentState.trigger({type: "enter", from: oldState});
  }
  trigger(event) {
    this.globalEventManager.trigger(event);
    if (this.currentState != null) this.currentState.trigger(event);
  }
}
