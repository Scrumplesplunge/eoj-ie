class Monster extends Humanoid {
  constructor(position, target) {
    super(position, "monster");
    this.target = target;
  }
  update(delta) {
    super.update(delta);

    if (this.target == null) {
      // Find a target.
      var wizards = this.universe.objects.filter(object => {
        if (!(object instanceof Wizard)) return false;
        if (object.universe == null) return false;
        var offset = object.position.sub(this.position);
        return offset.length() < Config.creatures.monster.chaseRange;
      });
      if (wizards.length > 0) this.target = wizards.random();
    }

    // Stop following the player if they have left the universe.
    if (this.target != null && this.target.universe == null) this.target = null;

    if (this.target != null && this.target.life > 0) {
      var offset = this.target.position.sub(this.position);
      var distance = offset.length();

      // Move towards the vertical location of the player.
      if (Math.abs(offset.x) < 10) {
        this.movement = 0;
      } else if (distance < Config.creatures.monster.chaseRange) {
        this.movement = offset.x < 0 ? -1 : 1;
      }

      if (distance < 20) {
        // We are within attack range.
        if (this.onGround()) {
          this.jump();
          this.target.hurt(Config.creatures.monster.attackDamage);
        }
        return;
      } else if (distance > Config.creatures.monster.chaseRange) {
        // Target is very far away. Stop following it.
        this.target = null;
      }
    }

    // Move randomly.
    this.moveRandomly(delta);
  }
}

class MonsterSpawner extends Effect {
  constructor(position, range, count) {
    super(position);
    this.range = range;
    this.count = count;
    this.on("update", event => this.update(event.delta));
    this.cooldown = 0;  // Time until another monster can appear.
  }
  update(delta) {
    this.cooldown = Math.max(0, this.cooldown - delta);
    if (this.universe == null) return;
    var wizards = this.universe.objects.filter(object => {
      if (!(object instanceof Wizard)) return false;
      var offset = object.position.sub(this.position);
      return offset.length() < this.range;
    });
    if (wizards.length > 0 && this.cooldown == 0) {
      this.universe.add(new Monster(this.position, wizards.random()));
      this.cooldown = Config.monsterSpawnerCooldown;
      this.count--;
      if (this.count == 0) this.remove();
    }
  }
}
