// An item is something a wizard can collect.
class Item extends Effect {
  constructor(sprite, position, radius, spriteRadius) {
    super(position, radius);
    this.sprite = sprite;
    this.spriteRadius = spriteRadius || radius;
  }
  activate(object) {
    if (object instanceof Wizard) {
      console.log("Item collected.");
      object.give(this);
      this.remove();
    }
  }
  use(wizard, targetPosition) { return Error("No method for use defined."); }
  draw(context) {
    var x = this.position.x, y = this.position.y, r = this.spriteRadius;
    Sprites.sheet.items.draw(context, this.sprite, x - r, y - r, 2 * r, 2 * r);
  }
}

class Health extends Effect {
  constructor(position, amount) {
    super(position, 10);
    this.amount = amount;
  }
  activate(object) {
    if (object instanceof Wizard) {
      console.log("Health +" + this.amount);
      object.heal(this.amount);
      this.remove();
    }
  }
  draw(context) {
    var x = this.position.x, y = this.position.y, r = 20;
    Sprites.sheet.items.draw(
        context, Sprites.codes.items.health, x - r, y - r, 2 * r, 2 * r);
  }
}

class SpellCast extends Effect {
  constructor(position, direction) {
    super(position, 20);
    this.lifetime = 3;  // Limit the lifetime of the spell for performance.
    this.on("update", event => this.update(event.delta));
    this.velocity = direction.mul(Config.spellSpeed);
  }
  update(delta) {
    this.universe.randomParticles(this.position, 20, 3, 100, 0.2);
    this.lifetime -= delta;
    if (this.lifetime < 0) this.remove();
  }
}

class TransformCast extends SpellCast {
  constructor(position, direction) { super(position, direction); }
  activate(object) {
    if ((object instanceof Creature) && !(object instanceof Wizard)) {
      console.log("Hit monster.");
      this.universe.randomParticles(object.position, 30, 50, 100, 0.5);
      var animalType = [Chicken, Pig, Sheep].random();
      var animal = new animalType(object.position);
      this.universe.add(animal);
      object.remove();
      this.remove();
    }
  }
}

class Spell extends Item {
  constructor(position, name, cast) {
    if (!Sprites.codes.items.hasOwnProperty(name))
      throw Error("No sprite for spell " + name);
    super(Sprites.codes.items[name], position, 10, 20);
    this.cast = cast;
  }
  use(wizard, targetPosition) {
    var spellDirection = targetPosition.sub(wizard.position).normalized();
    wizard.universe.add(new this.cast(wizard.position, spellDirection));
    wizard.hurt(Config.spellCost);
  }
}

class TransformSpell extends Spell {
  constructor(position) { super(position, "transformSpell", TransformCast); }
}

class PortalActivateCast extends SpellCast {
  constructor(position, direction) { super(position, direction); }
  activate(object) {
    if (object instanceof InactivePortal) {
      object.activatePortal();
      this.remove();
    }
  }
}

class PortalActivateSpell extends Spell {
  constructor(position) {
    super(position, "portalActivateSpell", PortalActivateCast);
  }
}

// A reward is something that a wizard already earned, but they don't get it
// until it reaches them.
class RewardItem extends Item {
  constructor(owner, sprite, position, radius, spriteRadius) {
    super(sprite, position, radius, spriteRadius);
    this.owner = owner;
    this.on("update", event => this.update(event.delta));
  }
  update(delta) {
    var offset = this.owner.position.sub(this.position);
    var jump = delta * Config.rewardSpeed;
    if (offset.squareLength() < jump * jump) {
      this.position = this.owner.position;
    } else {
      offset = offset.normalized().mul(jump);
      this.position = this.position.add(offset);
    }
  }
  activate(object) {
    if (object != this.owner) return;
    this.owner.give(this);
    this.remove();
  }
}
