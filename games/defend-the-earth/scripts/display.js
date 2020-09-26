class Display {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.center = new Vector(0, 0);
    this.scale = 1;
    this.target = null;
    this.mousePosition = new Vector(0, 0);
    this.mouseDown = false;

    window.addEventListener("mousedown", event => this.updateMouseDown(event));
    window.addEventListener("mousemove", event => this.handleMouseMove(event));
    window.addEventListener("mouseup", event => this.updateMouseDown(event));
    window.addEventListener("wheel", event => this.handleMouseWheel(event));
    window.addEventListener("contextmenu", event => event.preventDefault());
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  update(dt) {
    if (this.target == null) return;
    if (this.mouseDown) return;
    var targetPosition = this.target.position.add(this.target.velocity);
    var targetOffset = targetPosition.sub(this.center);
    var factor = 1 - Math.pow(1 - Config.CAMERA_TRACKING_RATE,
                              Config.UPDATE_DELTA);
    this.center = this.center.add(targetOffset.mul(factor));
  }

  draw(callback) {
    this.context.save();
      this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
      this.context.scale(this.scale, this.scale);
      this.context.translate(-this.center.x, -this.center.y);
      callback(this.context);
    this.context.restore();
  }

  toScreen(v) {
    var midpoint = new Vector(this.canvas.width / 2, this.canvas.height / 2);
    return v.sub(this.center).mul(this.scale).add(midpoint);
  }

  fromScreen(v) {
    var midpoint = new Vector(this.canvas.width / 2, this.canvas.height / 2);
    return v.sub(midpoint).div(this.scale).add(this.center);
  }

  topLeft() { return this.fromScreen(new Vector(0, 0)); }

  bottomRight() {
    return this.fromScreen(new Vector(this.canvas.width, this.canvas.height));
  }

  updateMouseDown(event) {
    event.preventDefault();
    this.mouseDown = ((event.buttons & MouseButtons.RIGHT) != 0);
  }

  handleMouseMove(event) {
    event.preventDefault();

    var mousePosition = new Vector(event.clientX, event.clientY);
    this.updateMouseDown(event);
    if (this.mouseDown) {
      var drag = mousePosition.sub(this.mousePosition);
      this.center = this.center.sub(drag.div(this.scale));
    }

    this.mousePosition = mousePosition;
  }

  handleMouseWheel(event) {
    event.preventDefault();

    var factor = Math.pow(0.5, event.deltaY / Config.SCROLL_PER_HALF_SCALE);
    var scale = this.scale * factor;
    if (scale < Config.MIN_SCALE) scale = Config.MIN_SCALE;
    if (scale > Config.MAX_SCALE) scale = Config.MAX_SCALE;

    // Adjust the center so that it feels like zooming is centered on the mouse
    // cursor.
    var zoomCenter = this.fromScreen(this.mousePosition);
    this.center = this.center.sub(zoomCenter).mul(this.scale / scale)
                      .add(zoomCenter);
    this.scale = scale;
  }
}
