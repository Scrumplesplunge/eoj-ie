class Humanoid extends Creature {
  constructor(position, type) {
    super(position, type, 25);
    this.type = type;

    // These properties are expected to be set by external code.
    this.bones = false;  // Set to true to only show the skeleton.
  }
  draw(context) {
    var part = this.sprites.part;
    var parts = this.bones ? [part.bones] : [part.shoes, part.skin, part.robe];
    parts.forEach(part => {
      Sprites.sheet[this.type].draw(
          context, this.sprite + part,
          this.position.x - 32, this.position.y - 32, 64, 64);
    });
  }
}
