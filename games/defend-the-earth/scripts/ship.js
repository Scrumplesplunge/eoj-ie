var leftGunOffset = new Vector(8, -2.5);
var rightGunOffset = new Vector(8, 2.5);
var leftEngineOffset = new Vector(-6, -2.5);
var rightEngineOffset = new Vector(-6, 2.5);

class Ship extends PhysicsObject {
  constructor(position) {
    super(images.ship, position, 10, 1e3);
    this.name = "Player Ship";
    this.destructable = true;
    this.health = Config.SHIP_HEALTH;
    this.thrust = 0;
    this.strafe = 0;
    this.firing = false;
    this.bulletDelay = 0;
    this.engineSound = sounds.rocketLoop.create();
    this.engineSound.loop = true;
    this.thrusterSound = sounds.thrusterLoop.create();
    this.thrusterSound.loop = true;
    this.strafeSound = sounds.thrusterLoop.create();
    this.strafeSound.loop = true;

    window.addEventListener("keydown", event => this.handleKeyDown(event));
    window.addEventListener("keyup", event => this.handleKeyUp(event));
    window.addEventListener("mousedown", event => this.updateMouseState(event));
    window.addEventListener("mouseup", event => this.updateMouseState(event));

    this.on("destroyed", event => this.handleDestroyed(event));
  }

  draw(ctx) {
    super.draw(ctx);
    if (this.thrust > 0) {
      var size = random(8, 12);

      // Draw the left thruster.
      ctx.save();
        var position = this.fromLocal(leftEngineOffset);
        ctx.translate(position.x, position.y);
        ctx.rotate(this.angle + random(-0.1, 0.1));
        ctx.drawImage(images.flame, -size, -0.5 * size, size, size);
      ctx.restore();

      // Draw the right thruster.
      ctx.save();
        var position = this.fromLocal(rightEngineOffset);
        ctx.translate(position.x, position.y);
        ctx.rotate(this.angle + random(-0.1, 0.1));
        ctx.drawImage(images.flame, -size, -0.5 * size, size, size);
      ctx.restore();
    }
  }

  update(dt) {
    super.update(dt);

    // Handle movement controls.
    var thrust = this.forward().mul(Config.SHIP_THRUST * this.thrust);
    var strafe = this.left().mul(Config.SHIP_STRAFE * this.strafe);
    this.applyImpulse(thrust.add(strafe).mul(dt));

    // Ship will always face the mouse.
    var mousePosition = display.fromScreen(display.mousePosition);
    this.angle = mousePosition.sub(this.position).toAngle();

    // Handle gunfire.
    if (this.firing) {
      this.bulletDelay -= dt;
      if (this.bulletDelay <= 0) {
        sounds.bullet.play();
        var leftGun = this.fromLocal(leftGunOffset);
        var rightGun = this.fromLocal(rightGunOffset);
        Bullet.fire(this, Config.SHIP_BULLET_DAMAGE, rightGun, this.forward(),
                    Config.SHIP_BULLET_SPRAY);
        Bullet.fire(this, Config.SHIP_BULLET_DAMAGE, leftGun, this.forward(),
                    Config.SHIP_BULLET_SPRAY);
        this.bulletDelay += 1 / Config.SHIP_FIRING_RATE;
      }
    }
  }

  handleKeyDown(event) {
    switch (event.keyCode) {
      case Keys.W: this.thrust = 1; this.engineSound.play(); break;
      case Keys.S: this.thrust = -1; this.thrusterSound.play(); break;
      case Keys.A: this.strafe = -1; this.strafeSound.play(); break;
      case Keys.D: this.strafe = 1; this.strafeSound.play(); break;
    }
  }

  handleKeyUp(event) {
    switch (event.keyCode) {
      case Keys.W: this.thrust = 0; this.engineSound.pause(); break;
      case Keys.S: this.thrust = 0; this.thrusterSound.pause(); break;
      case Keys.A: this.strafe = 0; this.strafeSound.pause(); break;
      case Keys.D: this.strafe = 0; this.strafeSound.pause(); break;
    }
  }

  updateMouseState(event) {
    this.firing = (event.buttons & MouseButtons.LEFT);
  }

  handleDestroyed(event) {
    sounds.explode.play();
    setTimeout(() => sounds.gameOver.play(), 1000);
  }

  showInfo(ctx, font) {
    ctx.save();
      font.color = "#ffffff";
      ctx.translate(font.drawAndMeasure(ctx, this.name + ": "), 0);
      var message = Math.ceil(this.health) + " HP";
      if (this.health <= 0) {
        font.color = "#ff0000";
        message = "DESTROYED";
      } else if (this.health < 0.2 * Config.SHIP_HEALTH) {
        font.color = "#ff0000";
      } else if (this.health < 0.5 * Config.SHIP_HEALTH) {
        font.color = "#ffff00";
      } else {
        font.color = "#ffffff";
      }
      font.draw(ctx, message);
    ctx.restore();
  }
}
