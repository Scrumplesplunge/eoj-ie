class Ball extends PhysicsObject {
  constructor(radius) {
    super(new Circle(new Vector, radius));
    this.radius = radius;
    this.restitution = 0.99;
    this.staticFriction = 1.25;
    this.dynamicFriction = 0.75;
    const mass = 0.5;
    this.inverseMass = 1 / mass;
    const inertia = 2/3 * mass * radius**2;
    this.inverseInertia = 1 / inertia;
  }
  draw(context) {
    context.save();
      context.translate(this.position.x, this.position.y);
      context.rotate(this.angle);
      const r = this.radius;
      context.drawImage(Ball.image, -r, -r, 2 * r, 2 * r);
    context.restore();
  }
}
Ball.image = new Image;
Ball.image.src = "ball.png";

class Crate extends PhysicsObject {
  constructor(size) {
    super(new AABB(size.mul(-0.5), size.mul(0.5)));
    this.size = size;
    this.restitution = 0.2;
    const mass = (size.x * size.y) ** (3/2) * 100;  // 100kg/m³
    this.inverseMass = 1 / mass;
    const inertia = 1/12 * mass * size.dot(size);
    // Should be 1/inertia, but the engine is more stable with amplified inertia
    this.inverseInertia = 0.2 / inertia;
    console.log(`mass: ${mass}, inertia: ${inertia}`);
  }
  draw(context) {
    context.save();
      context.translate(this.position.x, this.position.y);
      context.rotate(this.angle);
      const extent = this.size.mul(0.5);
      context.drawImage(
          Crate.image, -extent.x, -extent.y, this.size.x, this.size.y);
    context.restore();
  }
}
Crate.image = new Image;
Crate.image.src = "crate.png";

class Wall extends PhysicsObject {
  constructor(position, size) {
    super(new AABB(size.mul(-0.5), size.mul(0.5)));
    this.position = position;
    this.size = size;
    this.inverseMass = 0;
    this.inverseInertia = 0;
  }
  draw(context) {
    context.save();
      context.translate(this.position.x, this.position.y);
      context.rotate(this.angle);
      context.fillStyle = context.createPattern(Wall.image, "repeat");
      const extent = this.size.mul(0.5);
      context.beginPath();
      context.rect(-extent.x, -extent.y, this.size.x, this.size.y);
      context.scale(1/256, 1/256);
      context.fill();
    context.restore();
  }
}
Wall.image = new Image;
Wall.image.src = "bricks.png";

function randomPosition() {
  return new Vector(3.6 * Math.random() - 1.8, 2.5 * Math.random() - 3);
}

function randomBall(position) {
  const ball = new Ball(0.1 + 0.05 * Math.random());
  ball.position = position;
  return ball;
}

function randomCrate(position) {
  const w = 0.45 + 0.1 * Math.random(), h = 0.45 + 0.1 * Math.random();
  const crate = new Crate(new Vector(w, h));
  crate.position = position;
  return crate;
}

const world = [
  new Wall(new Vector(-4, 0), new Vector(0.5, 6)),
  new Wall(new Vector(4, 0), new Vector(0.5, 6)),
  new Wall(new Vector(0, -3), new Vector(8.5, 0.5)),
  new Wall(new Vector(0, 3), new Vector(8.5, 0.5)),
  new Wall(new Vector(-1.5, 1), new Vector(3, 0.5)),
];

world[4].angle = 0.5;

// Build some stacks.
const FLOOR_HEIGHT = 2.75;
for (let stack = 0; stack < 2; stack++) {
  const x = 1 + stack * 2;
  let y = FLOOR_HEIGHT;
  while (true) {
    const crate = randomCrate(new Vector(x, 0));
    crate.position.y = y - 0.5 * crate.size.y;
    y -= crate.size.y;
    if (y < -2) break;
    world.push(crate);
  }
}

world.push(randomBall(new Vector(-2, -1)));

addEventListener('contextmenu', event => {
  event.preventDefault();
});

addEventListener('mousedown', event => {
  if (event.button == 2 || event.button == 3) {
    const item = event.button == 2 ? randomCrate() : randomBall();
    item.position = mouse;
    world.push(item);
    mouseDown();
  }
});

let gravity = new Vector(0, 10);

addEventListener("devicemotion", event => {
  const strength = 5;
  gravity.x = -strength * event.accelerationIncludingGravity.x;
  gravity.y = strength * event.accelerationIncludingGravity.y;
});

let heldItem = null;
let holdOffset = new Vector;

let mouse = new Vector;
function mouseMove(position) {
  mouse = position;
}

function mouseDown() {
  heldItem = null;
  for (const x of world) {
    if (x.movable() && x.getMesh().contains(mouse)) {
      console.log("Holding " + x.constructor.name);
      heldItem = x;
      holdOffset = heldItem.toLocal(mouse);
      break;
    }
  }
}

function mouseUp() { heldItem = null; }

function innerTick(dt) {
  // Update objects.
  for (const x of world) {
    // Apply gravity to all objects with mass.
    if (x.inverseMass) {
      x.velocity = x.velocity.add(gravity.mul(dt));
    }
    x.update(dt);
  }
  // Detect all collisions.
  const collisions = [];
  for (let i = 0, n = world.length; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!world[i].movable() && !world[j].movable()) continue;
      const collision = intersect(world[i], world[j]);
      if (collision) collisions.push(collision);
    }
  }
  // Correct collisions in reverse order of their overlap.
  collisions.sort((a, b) => b.depth - a.depth);
  for (const collision of collisions) {
    collision.correct();
    collision.resolve();
  }
}

function tick(dt) {
  // Apply forces to the held item.
  if (heldItem) {
    const target = mouse;
    const current = heldItem.toWorld(holdOffset);
    const targetVelocity = target.sub(current).mul(1 / dt);
    const currentVelocity = heldItem.velocity;
    const acceleration = targetVelocity.sub(currentVelocity);
    const impulse = acceleration.mul(0.5 / heldItem.inverseMass);
    heldItem.applyImpulse(impulse, current);
  }
  const rounds = 20;
  for (let i = 0; i < rounds; i++) innerTick(dt / rounds);
}

const background = new Image;
background.src = "background.png";
function draw(context) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  for (const x of world) x.draw(context);
}
