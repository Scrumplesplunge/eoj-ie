class InactivePortal extends PhysicsObject {
  constructor(position, newState) {
    super(position, 10);
    this.immovable = true;
    this.animationTime = 0;
    this.newState = newState;
    this.on("update", event => this.animationTime += event.delta);
  }
  activatePortal() {
    this.universe.add(new Portal(this.position, this.newState));
    this.remove();
  }
  draw(context) {
    var portal = Sprites.codes.items.inactivePortal;
    var phase = Math.floor(Config.animationFrameRate * this.animationTime);
    var sprite = portal[phase % portal.length];
    var x = this.position.x, y = this.position.y, r = 50;
    Sprites.sheet.items.draw(context, sprite, x - r, y - r, 2 * r, 2 * r);
  }
}

class Portal extends Effect {
  constructor(position, newState) {
    super(position, 10);
    this.animationTime = 0;
    this.newState = newState;
    this.on("update", event => this.animationTime += event.delta);
  }
  activate(object) {
    if (object instanceof Wizard) {
      console.log("Portal reached.");
      object.remove();
      Game.switchState(this.newState);
    }
  }
  draw(context) {
    var portal = Sprites.codes.items.portal;
    var phase = Math.floor(Config.animationFrameRate * this.animationTime);
    var sprite = portal[phase % portal.length];
    var x = this.position.x, y = this.position.y, r = 50;
    Sprites.sheet.items.draw(context, sprite, x - r, y - r, 2 * r, 2 * r);
  }
}
