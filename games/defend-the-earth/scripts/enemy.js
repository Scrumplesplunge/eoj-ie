class EnemyOptions {
  constructor() {
    this.size = 20;
    this.speed = 100;
    this.health = 100;
    this.firingRate = 20;
    this.attackRange = 750;
    this.targets = [ship, earth];
    this.orbitAltitude = Config.STARTING_ALTITUDE * random(2, 5);
  }

  setSize(x) { this.size = x; return this; }
  setSpeed(x) { this.speed = x; return this; }
  setHealth(x) { this.health = x; return this; }
  setFiringRate(x) { this.firingRate = x; return this; }
  setAttackRange(x) { this.attackRange = x; return this; }
  setTargets(targets) { this.targets = x; return this; }
  setOrbitAltitude(x) { this.orbitAltitude = x; return this; }
}

class Wreckage extends PhysicsObject {
  constructor(position, radius) {
    var mass = 40 * radius * radius;
    super(images.wreckage.randomEntry(), position, radius, mass);
    this.destructable = true;
    this.health = 20;

    this.on("destroyed", event => sounds.poof.play());
  }
}

class Enemy extends PhysicsObject {
  constructor(position, options) {
    var radius = options.size, mass = 40 * options.size * options.size;
    super(images.enemy, position, radius, mass);
    this.name = "Enemy Ship";
    this.indicated = true;
    this.speed = options.speed;
    this.health = options.health;
    this.targets = options.targets;
    this.firing = false;
    this.firingRate = options.firingRate;
    this.firingAngle = -Math.PI / 2;
    this.attackRange = options.attackRange;
    this.destructable = true;
    this.orbitAltitude = options.orbitAltitude;

    this.on("destroyed", event => this.handleDestroyed(event));
  }

  update(dt) {
    // Attack the highest priority target that is within attack range.
    var target = this.firstTargetInRange();
    if (target == null) {
      if (this.firing) sounds.enemyDeactivate.play();
      this.firing = false;
    } else {
      if (!this.firing) sounds.enemyActivate.play();
      this.firing = true;
      this.firingAngle = target.position.sub(this.position).toAngle();
    }

    if (earth.universe != null) {
      // Intended flight path is always to orbit the Earth.
      var a = Universe.gravity(earth, this).len() / this.mass;
      var offset = earth.position.sub(this.position);
      var targetSpeed = Math.sqrt(offset.len() * a);
      var orbitVelocity = offset.norm().rotate90().mul(targetSpeed);

      // Try to stay close to the orbit altitude.
      var approachSpeed = clamp(
          offset.len() - this.orbitAltitude - Config.EARTH_RADIUS,
          -Config.ENEMY_APPROACH_SPEED, Config.ENEMY_APPROACH_SPEED);
      var approachVelocity = offset.norm().mul(approachSpeed);

      var targetVelocity = orbitVelocity.add(approachVelocity);
      var accel = targetVelocity.sub(this.velocity);
      this.velocity = this.velocity.add(accel.mul(dt));
    }

    this.handleSpooling(dt);
  }

  firstTargetInRange() {
    var target = null;
    for (var i = 0, n = this.targets.length; i < n; i++) {
      var targetOffset = this.targets[i].position.sub(this.position);
      if (targetOffset.len() > this.attackRange) continue;
      var result = this.universe.cast(this.position, targetOffset,
                                      object => object.hittable);
      if (result.object == this.targets[i]) {
        target = this.targets[i];
        break;
      }
    }
    return target;
  }

  closestTarget() {
    var bestDistance = Infinity;
    var target = null;
    for (var i = 0, n = this.targets.length; i < n; i++) {
      var distance = this.targets.position.sub(this.position).len();
      if (distance < bestDistance) {
        bestDistance = distance;
        target = this.targets[0];
      }
    }
    return target;
  }

  handleSpooling(dt) {
    // Update the angular velocity.
    var targetAngularVelocity;
    if (this.firing) {
      targetAngularVelocity =
          this.firingRate * 2 * Math.PI / Config.ENEMY_LASERS;
    } else {
      targetAngularVelocity = Config.ENEMY_IDLE_SPIN_RATE;
    }
    var angularVelocityOffset = targetAngularVelocity - this.angularVelocity;
    var angularAccel = clamp(angularVelocityOffset * dt,
                             -Config.ENEMY_SPIN_DOWN_RATE * dt,
                             Config.ENEMY_SPIN_UP_RATE * dt);
    this.angularVelocity += angularAccel;

    // Fire bullets if necessary.
    var phase = () => Math.floor(Config.ENEMY_LASERS *
                                 angnorm(this.angle - this.firingAngle) /
                                 TWO_PI);
    var before = phase();
    super.update(dt)
    var after = phase();
    
    if (before != after && this.firing) this.fire();
  }

  fire() {
    sounds.enemyBullet.play();
    var direction = Vector.fromAngle(this.firingAngle);
    Bullet.fire(this, Config.ENEMY_BULLET_DAMAGE,
                this.position.add(direction.mul(this.radius)),
                direction, Config.ENEMY_BULLET_SPRAY);
  }

  handleDestroyed(event) {
    sounds.explode.play();

    // Scatter some wreckage.
    for (var i = 0; i < 5; i++) {
      var angle = 2 * Math.PI * i / 5;
      var offset = Vector.fromAngle(angle).mul(this.radius * 0.5);
      var wreckage = new Wreckage(this.position.add(offset), this.radius * 0.5);
      var relativeVelocity = offset.mul(random(0, Config.MAX_EXPLOSION_SPEED));
      wreckage.velocity = this.velocity.add(relativeVelocity);
      wreckage.angularVelocity =
          random(-Config.MAX_EXPLOSION_SPEED, Config.MAX_EXPLOSION_SPEED);
      this.universe.add(wreckage);
    }
  }
}
