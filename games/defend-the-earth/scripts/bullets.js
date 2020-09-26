var bullets = [];
var oldestBullet = 0;

class Bullet extends PhysicsObject {
  constructor(owner, damage, position, velocity) {
    super(images.bullet, position, 5, 0.3);
    this.damage = damage;
    this.owner = owner;
    this.velocity = velocity;
    this.angle = velocity.toAngle();
    this.hittable = false;

    this.on("collision", event => this.handleHit(event));
  }
  
  static fire(owner, damage, position, direction, aimNoise) {
    // Create a new bullet.
    var aimDirection = direction.rotate(random(-aimNoise, aimNoise));
    var velocity = owner.velocity.add(aimDirection.mul(Config.BULLET_SPEED));
    var bullet = new Bullet(owner, damage, position, velocity);

    universe.add(bullet);
    if (bullets.length < Config.MAX_BULLETS) {
      bullets.push(bullet);
    } else {
      // There are already Config.MAX_BULLETS, so we have to replace an old one.
      universe.remove(bullets[oldestBullet]);
      bullets[oldestBullet] = bullet;
      oldestBullet = (oldestBullet + 1) % Config.MAX_BULLETS;
    }

    // Conserve momentum against the firer.
    owner.applyImpulse(velocity.mul(-bullet.mass));
  }

  update(dt) {
    super.update(dt);
    this.angle = this.velocity.toAngle();
  }

  handleHit(event) {
    if (event.object == this.owner) return;
    if (!event.object.hittable) return;
    event.object.damage(this.damage);
    this.remove();
  }
}
