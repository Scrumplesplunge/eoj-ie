var Game = (function() {
  Metrics.add("update-time-ms", new Distribution(2));
  Metrics.add("draw-time-ms", new Distribution(2));

  var pageLoadState = new EventManager("pageload");
  var startState = new EventManager("start");
  var gameState = new GameState(pageLoadState);
  var canvas;
  var context;

  // Switch into the start state once the page has loaded.
  function load() { gameState.switchTo(startState); }
  window.addEventListener("load", load);

  // Start drawing once we enter the start state.
  var lastUpdate = Date.now();
  function updateLoop() {
    // Compute the delta to be passed to the update function.
    var now = Date.now();
    var delta = (now - lastUpdate) / 1000;
    lastUpdate = now;
    
    // Time each of the stages for monitoring purposes.
    var updateStart = Date.now();
    gameState.trigger({type: "update", delta: delta});
    var updateEnd = Date.now();
    Metrics.record("update-time-ms", updateEnd - updateStart);

    var drawStart = Date.now();
    gameState.trigger({type: "draw", context: context});
    var drawEnd = Date.now();
    Metrics.record("draw-time-ms", drawEnd - drawStart);

    setTimeout(updateLoop, 1000 * Config.updateDelay);
  }

  var startStateEntered = false;
  startState.on("enter", function() {
    if (startStateEntered)
      throw Error("Cannot enter start state a second time.");
    startStateEntered = true;

    canvas = document.getElementById("screen");
    canvas.width = Config.screen.width;
    canvas.height = Config.screen.height;
    context = canvas.getContext("2d");
    schedule(updateLoop);

    // Forward various page events to the active state.
    canvas.addEventListener("mousemove", function(event) {
      gameState.trigger({
        type: "mousemove",
        x: event.offsetX,
        y: event.offsetY,
      });
    });
    canvas.addEventListener("mousedown", function(event) {
      gameState.trigger({type: "mousedown", button: event.button});
      event.preventDefault();
    });
    canvas.addEventListener("contextmenu", event => event.preventDefault());
    canvas.addEventListener("mouseup", function(event) {
      gameState.trigger({type: "mouseup", button: event.button});
    });
    window.addEventListener("keydown", function(event) {
      gameState.trigger({type: "keydown", key: event.key});
    });
    window.addEventListener("keyup", function(event) {
      gameState.trigger({type: "keyup", key: event.key});
    });
  });

  return {
    startState: startState,
    switchState: state => gameState.switchTo(state),
  };
}());
