var RepairState = {
  HEALTHY: 0,
  DAMAGE_COOLDOWN: 1,
  REPAIRING: 2,
};

class EarthLump extends PhysicsObject {
  constructor(position, radius) {
    var mass = 40 * radius * radius;
    super(images.earthLump.randomEntry(), position, radius, mass);
    this.destructable = true;
    this.health = 50;

    this.on("destroyed", event => sounds.explode.play());
  }
}

class Earth extends PhysicsObject {
  constructor(position) {
    super(images.earth, position, Config.EARTH_RADIUS, Config.EARTH_MASS);
    this.name = "Planet Earth";
    this.indicated = true;
    this.angularVelocity = 0.05;
    this.destructable = true;
    this.health = Config.EARTH_HEALTH;
    this.repairState = RepairState.HEALTHY;
    this.rechargeDelay = 0;

    this.on("destroyed", event => this.handleDestroyed(event));
  }

  update(dt) {
    super.update(dt);

    this.repairDelay -= dt;
    if (this.health < Config.EARTH_HEALTH && this.repairDelay <= 0) {
      this.health += Config.EARTH_REPAIR_STEP;
      this.repairDelay = Config.EARTH_REPAIR_DELAY;
      if (this.health >= Config.EARTH_HEALTH) {
        this.health = Config.EARTH_HEALTH;
        this.repairState = RepairState.HEALTHY;
      } else {
        this.repairState = RepairState.REPAIRING;
      }
    }
  }

  showInfo(ctx, font) {
    ctx.save();
      font.color = "#ffffff";
      ctx.translate(font.drawAndMeasure(ctx, this.name + ": "), 0);
      var message = Math.ceil(this.health) + " HP";
      if (this.health <= 0) {
        font.color = "#ff0000";
        message = "DESTROYED";
      } else {
        switch (this.repairState) {
          case RepairState.HEALTHY: font.color = "#ffffff"; break;
          case RepairState.DAMAGE_COOLDOWN: font.color = "#ff0000"; break;
          case RepairState.REPAIRING: font.color = "#00ff00"; break;
        }
      }
      font.draw(ctx, message);
    ctx.restore();
  }

  handleDestroyed(event) {
    sounds.earthExplode.play();
    setTimeout(() => sounds.earthGone.play(), 2000);

    // Scatter some wreckage.
    for (var i = 0; i < 50; i++) {
      var angle = 2 * Math.PI * i / 5;
      var size = this.radius * Math.pow(random(0.1, 0.4), 2);
      var offset = Vector.fromAngle(angle).mul(size);
      var lump = new EarthLump(this.position.add(offset), size);
      var relativeVelocity = offset.mul(random(0, Config.MAX_EXPLOSION_SPEED));
      lump.velocity = this.velocity.add(relativeVelocity);
      lump.angularVelocity =
          random(-Config.MAX_EXPLOSION_SPEED, Config.MAX_EXPLOSION_SPEED);
      this.universe.add(lump);
    }
  }

  damage(x) {
    super.damage(x);
    this.repairState = RepairState.DAMAGE_COOLDOWN;
    this.repairDelay = Config.EARTH_REPAIR_COOLDOWN;
  }
}
