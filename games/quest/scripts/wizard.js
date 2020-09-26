class Wizard extends Humanoid {
  constructor(position) {
    super(position, "wizard");
    this.items = [];  // Things collected by the wizard.
    this.selectedItem = 0;
    this.life = Config.creatures.wizard.maxLife;
  }
  update(delta) {
    super.update(delta);
    this.hurt(Config.creatures.wizard.lifeLostPerSecond * delta);
  }
  give(item) {
    if (!(item instanceof Item)) throw Error("Only items can be given.");
    this.items.push(item);
  }
  heal(amount) {
    this.life = Math.min(this.life + amount, Config.creatures.wizard.maxLife);
  }
  hurt(amount) {
    this.life -= amount;
    if (this.life <= 0) {
      console.log("Wizard died.");
      this.trigger({type: "death"});
      this.remove();
    }
  }
  trySelectItem(item) {
    if (0 <= item && item < this.items.length)
      this.selectedItem = item;
  }
  tryCast(targetPosition) {
    if (this.selectedItem < this.items.length) {
      this.items[this.selectedItem].use(this, targetPosition);
    }
  }
}
