// A boundary is a one-way forcefield. The player may move through in one
// direction, but will not pass through in the other direction. If the first
// point is to the left, and the second point is to the right, then the player
// may move upwards through the boundary but not downwards.
class Boundary {
  constructor(a, b) {
    this.a = a;
    this.b = b;
    this.universe = null;
  }
  allowedDirection() { return this.b.sub(this.a).rotate90(); }
  disallowedDirection() { return this.allowedDirection().neg(); }
  draw(context) {
    context.beginPath();
    context.moveTo(this.a.x, this.a.y);
    context.lineTo(this.b.x, this.b.y);
    context.stroke();
  }
  remove() { this.universe = null; }
}

// Particles do nothing except move and look cool.
class Particle {
  constructor(sprite, radius, position, velocity, lifetime) {
    this.sprite = sprite;
    this.radius = radius;
    this.position = position;
    this.velocity = velocity;
    this.lifetime = lifetime;
    this.universe = null;
  }
  update(delta) {
    this.position = this.position.add(this.velocity.mul(delta));
    this.lifetime -= delta;
    if (this.lifetime < 0) this.remove();
  }
  draw(context) {
    var x = this.position.x, y = this.position.y, r = this.radius;
    Sprites.sheet.particles.draw(
        context, this.sprite, x - r, y - r, 2 * r, 2 * r);
  }
  remove() { this.universe = null; }
}

// An effect is like a boundary, except that an intersection does not result in
// collision resolution. Instead, it activates custom effects.
class Effect extends EventManager {
  constructor(position, radius) {
    super("effect");
    this.position = position;
    this.velocity = new Vector(0, 0);
    this.radius = radius;
    this.universe = null;
  }
  activate(object) {
    throw new Error("No activate function provided for effect.");
  }
  draw(context) {}
  remove() { this.universe = null; }
}

// A physics object is something which collides with the world. They are
// modelled as circles for simplicity.
class PhysicsObject extends EventManager {
  constructor(position, radius) {
    super("physicsobject");
    this.position = position;
    this.immovable = false;
    this.velocity = new Vector(0, 0);
    this.radius = radius;
    this.universe = null;
  }
  draw(context) { throw new Error("No draw function provided for object."); }
  remove() { this.universe = null; }
}

class Universe extends EventManager {
  constructor(name) {
    super(name);
    this.boundaries = [];
    this.effects = [];
    this.particles = [];
    this.objects = [];
    this.on("update", event => this.update(event.delta));
    this.on("draw", event => this.draw(event.context));
  }
  add(x) {
    x.universe = this;
    if (x instanceof Boundary) {
      this.boundaries.push(x);
    } else if (x instanceof Effect) {
      this.effects.push(x);
    } else if (x instanceof Particle) {
      this.particles.push(x);
    } else if (x instanceof PhysicsObject) {
      this.objects.push(x);
    } else {
      throw Error("Invalid type to add to universe.");
    }
  }
  update(delta) {
    // Perform independent updates for all effects and objects.
    this.effects.forEach(function(effect) {
      effect.trigger({type: "update", delta: delta});
      effect.position = effect.position.add(effect.velocity.mul(delta));
    });
    var gravity = new Vector(0, Config.gravity);
    this.particles.forEach(particle => particle.update(delta));
    this.objects.forEach(function(object) {
      object.trigger({type: "update", delta: delta});
      if (!object.immovable) {
        object.velocity = object.velocity.add(gravity);
        object.position = object.position.add(object.velocity.mul(delta));
      }
    });
    this.resolveCollisions();
    this.activateEffects();
    removeIf(boundary => boundary.universe == null, this.boundaries);
    removeIf(effect => effect.universe == null, this.effects);
    removeIf(particle => particle.universe == null, this.particles);
    removeIf(object => object.universe == null, this.objects);
  }
  randomParticles(position, maxRadius, count, speedFactor, maxLifetime) {
    for (var i = 0; i < count; i++) {
      var sprite = Sprites.codes.particles.random();
      var radius = maxRadius * Math.random();
      var velocity = Vector.random().mul(speedFactor);
      var lifetime = maxLifetime * Math.random();
      this.add(new Particle(sprite, radius, position, velocity, lifetime));
    }
  }
  resolveCollisions() {
    for (var i = 0, n = this.objects.length; i < n; i++) {
      var object = this.objects[i];
      if (object.universe == null) continue;
      var radius = object.radius;
      for (var j = 0, m = this.boundaries.length; j < m; j++) {
        var boundary = this.boundaries[j];
        if (boundary.universe == null) continue;
        // Compute where the object is relative to the boundary.
        var lineDirection = boundary.b.sub(boundary.a);
        var offsetA = object.position.sub(boundary.a);
        var locationOnLine =
            lineDirection.dot(offsetA) / lineDirection.squareLength();
        if (locationOnLine < 0) {
          if (offsetA.squareLength() < radius * radius) {
            // Collision with endpoint a.
            this.resolve(object, boundary, offsetA);
          }
          continue;
        }
        var offsetB = object.position.sub(boundary.b);
        if (locationOnLine > 1) {
          if (offsetB.squareLength() < radius * radius) {
            // Collision with endpoint b.
            this.resolve(object, boundary, offsetB);
          }
          continue;
        }
        var boundaryNormal = lineDirection.rotate90().normalized();
        var surfaceDistance = boundaryNormal.dot(offsetA);
        if (-radius < surfaceDistance && surfaceDistance < radius) {
          // Collision with surface.
          var offset = boundaryNormal.mul(surfaceDistance);
          this.resolve(object, boundary, offset);
          continue;
        }
      }
    }
  }
  resolve(object, boundary, offset) {
    var disallowedDirection = boundary.disallowedDirection().normalized();
    var disallowedComponent = object.velocity.dot(disallowedDirection);
    // If the component is negative, we will not collide with the boundary. We
    // make this stricter by comparing against -10 because when you have two
    // boundaries arranged in a < where the bottom one is slightly slanted
    // downhill into the corner and the top one would hit the player's head, the
    // position adjustments done by the two boundaries in sequence results in
    // the player drifting through the wall.
    if (disallowedComponent < -10) return;

    object.velocity =
        object.velocity.sub(disallowedDirection.mul(disallowedComponent));

    // Move the object along the offset vector until it is no longer
    // intersecting.
    var offsetLength = offset.length();
    var adjustment = offset.mul((object.radius - offsetLength) / offsetLength);
    object.position = object.position.add(adjustment);
    object.trigger({type: "collide", boundary: boundary, offset: offset});
  }
  activateEffects() {
    for (var i = 0, n = this.objects.length; i < n; i++) {
      var object = this.objects[i];
      if (object.universe == null) continue;
      for (var j = 0, m = this.effects.length; j < m; j++) {
        var effect = this.effects[j];
        if (effect.universe == null) continue;
        var offset = effect.position.sub(object.position);
        var combinedRadius = object.radius + effect.radius;
        if (offset.squareLength() < combinedRadius * combinedRadius)
          effect.activate(object);
      }
    }
  }
  draw(context) {
    if (Config.showBoundaries)
      this.boundaries.forEach(boundary => boundary.draw(context));
    this.effects.forEach(effect => effect.draw(context));
    this.particles.forEach(particle => particle.draw(context));
    this.objects.forEach(object => object.draw(context));
  }
}
