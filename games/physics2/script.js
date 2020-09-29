

class Ball extends PhysicsObject {
  constructor(radius) {
    super(new Circle(new Vector, radius));
    this.radius = radius;
    this.restitution = 0.99;
    this.staticFriction = 0.5;
    this.dynamicFriction = 0.3;
    this.inverseInertia = 30;
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
      context.scale(0.01, 0.01);
      context.fill();
    context.restore();
  }
}
Wall.image = new Image;
Wall.image.src = "bricks.png";

function randomBall() {
  return new Ball(0.2 + 0.1 * Math.random());
}

function randomCrate() {
  const x = 0.4 + 0.2 * Math.random(), y = 0.4 + 0.2 * Math.random();
  return new Crate(new Vector(x, y));
}

function item(position) {
  const object = Math.random() < 0.5 ? randomBall() : randomCrate();
  object.position = position;
  object.angle = 2 * Math.PI * Math.random();
  return object;
}

const world = [
  new Wall(new Vector(-4, 0), new Vector(0.5, 6)),
  new Wall(new Vector(4, 0), new Vector(0.5, 6)),
  new Wall(new Vector(0, -3), new Vector(8.5, 0.5)),
  new Wall(new Vector(0, 3), new Vector(8.5, 0.5)),
  new Wall(new Vector(-1.5, 1), new Vector(3, 0.5)),
];
world[4].angle = 0.5;
for (let i = 0; i < 20; i++) {
  const x = 3.6 * Math.random() - 1.8;
  const y = 2.5 * Math.random() - 3;
  world.push(item(new Vector(x, y)));
}

let gravity = new Vector(0, 10);
screen.orientation.lock();
addEventListener("devicemotion", event => {
  const acceleration = event.accelerationIncludingGravity;
  if (acceleration.x === null && acceleration.y === null) return;
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
  // Resolve collisions.
  for (let i = 0, n = world.length; i < n; i++) {
    const movableA = world[i].movable();
    for (let j = i + 1; j < n; j++) {
      if (!movableA && !world[j].movable()) continue;
      const collision = intersect(world[i], world[j]);
      if (!collision) continue;
      collision.resolve();
      collision.correct();
    }
  }
}

function tick(dt) {
  const rounds = 5;
  for (let i = 0; i < rounds; i++) innerTick(dt / rounds);
}

const background = new Image;
background.src = "background.png";
function draw(context) {
  context.fillStyle = context.createPattern(background, "repeat");
  context.beginPath();
  context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.rect(0, 0, context.canvas.width, context.canvas.height);
  context.restore();
  context.save();
    context.scale(0.01, 0.01);
    context.fill();
  context.restore();
  for (const x of world) x.draw(context);
}
