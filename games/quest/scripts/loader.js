class Loader extends EventManager {
  constructor(name) {
    super(name);
    this.barrier = new AsyncBarrier;
    this.loadHistory = [];
    this.on("draw", event => this.draw(event.context));
  }
  loadImage(name) { return loadImage(name, this.loaded(name)); }
  loaded(name) { return this.barrier.increment(() => this.log(name)); }
  waitUntilLoaded(callback) {
    this.barrier.wait(callback);
  }
  log(message) {
    this.loadHistory.push(message);
    if (this.loadHistory.length > Config.loader.history)
      this.loadHistory.shift();
  }
  draw(context) {
    var canvas = context.canvas;
    context.save();
      context.fillStyle = Config.loader.backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = Config.loader.color;
      var x = 0.5 * canvas.width, y = 0.5 * canvas.height;
      context.textAlign = "center";
      context.font = Config.loader.largeFontSize + "pt sans-serif";
      context.fillText("Loading", x, y);
      context.font = Config.loader.smallFontSize + "pt sans-serif";
      for (var i = 0, n = this.loadHistory.length; i < n; i++) {
        y += Config.loader.smallFontSize * 2;
        context.globalAlpha = 1 - i / Config.loader.history;
        context.fillText(this.loadHistory[n - i - 1], x, y);
      }
    context.restore();
  }
}
