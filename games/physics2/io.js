const canvas = document.getElementById("screen");
const context = canvas.getContext("2d");

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  clone() { return new Vector(this.x, this.y); }
  add(v) { return new Vector(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector(this.x - v.x, this.y - v.y); }
  mul(s) { return new Vector(this.x * s, this.y * s); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  cross(v) { return this.x * v.y - this.y * v.x; }
  rotate90() { return new Vector(-this.y, this.x); }
  squareLength() { return this.dot(this); }
  length() { return Math.sqrt(this.squareLength()); }
  neg() { return new Vector(-this.x, -this.y); }
  normalized() {
    const length = this.length();
    return length == 0 ? new Vector(1, 0) : this.mul(1 / length);
  }
  toString() {
    return "[" + this.x.toPrecision(4) + ", " + this.y.toPrecision(4) + "]";
  }
}

class Matrix {
  constructor(a, b) {
    this.a = a;
    this.b = b;
  }
  static rotate(theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    return new Matrix(new Vector(c, s), new Vector(-s, c));
  }
  apply(v) { return this.a.mul(v.x).add(this.b.mul(v.y)); }
}

const camera = {
  position: new Vector,
  scale: 150,
};

function tick(dt) {}
function draw() {}
function mouseMove(position) {}
function mouseDown() {}
function mouseUp() {}

addEventListener("mousemove", event => {
  const raw = new Vector(event.x, event.y).mul(devicePixelRatio);
  const size = new Vector(canvas.width, canvas.height);
  mouseMove(raw.sub(size.mul(0.5)).mul(1 / camera.scale).add(camera.position));
});

addEventListener("mousedown", event => mouseDown());
addEventListener("mouseup", event => mouseUp());

function handleTouch(event) {
  const {clientX, clientY} = event.touches[0];
  const raw = new Vector(clientX, clientY).mul(devicePixelRatio);
  const size = new Vector(canvas.width, canvas.height);
  mouseMove(raw.sub(size.mul(0.5)).mul(1 / camera.scale).add(camera.position));
}

addEventListener("touchmove", handleTouch);
addEventListener("touchstart", event => { handleTouch(event); mouseDown(); });
addEventListener("touchend", event => { mouseUp(); });

function resize() {
  canvas.width = devicePixelRatio * innerWidth;
  canvas.height = devicePixelRatio * innerHeight;
  camera.scale = Math.min(canvas.width / 10, canvas.height / 8);
  draw();
}
resize();
addEventListener("resize", resize);

const deltaTime = 0.02;
setInterval(() => tick(deltaTime), 1000 * deltaTime);

function drawLoop() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.lineWidth = 1 / camera.scale;
  context.translate(canvas.width / 2, canvas.height / 2);
  context.scale(camera.scale, camera.scale);
  context.translate(-camera.position.x, -camera.position.y);
  draw(context);
  context.restore();
  requestAnimationFrame(drawLoop);
}
drawLoop();
