function image(src) {
  var out = new Image();
  out.src = src;
  return out;
}

class Sound {
  constructor(file) {
    this.file = file;
    this.instances = [];
    this.inactiveInstances = [];
  }

  play() {
    if (this.inactiveInstances.length > 0) {
      this.inactiveInstances.pop().play();
    } else if (this.instances.length < Config.MAX_INSTANCES_PER_SOUND) {
      var a = new Audio(this.file);
      this.instances.push(a);
      a.addEventListener("ended", () => this.inactiveInstances.push(a));
      a.play();
    } else {
      console.log("Too many instances of " + this.file);
    }
  }

  repeat() {
    var a = new Audio(this.file);
    a.loop = true;
    a.play();
    return a;
  }

  create() { return new Audio(this.file) }
}

function sound(src) { return new Sound(src); }

var images = {
  arrow: image("images/arrow.png"),
  bullet: image("images/bullet.png"),
  earth: image("images/earth.png"),
  earthLump: [
    image("images/earth_lump1.png"),
    image("images/earth_lump2.png"),
    image("images/earth_lump3.png"),
    image("images/earth_lump4.png"),
  ],
  enemy: image("images/enemy.png"),
  flame: image("images/flame.png"),
  ship: image("images/ship.png"),
  text: image("images/text.png"),
  wreckage: [
    image("images/wreckage1.png"),
    image("images/wreckage2.png"),
    image("images/wreckage3.png"),
    image("images/wreckage4.png"),
    image("images/wreckage5.png"),
  ],
};

var sounds = {
  background: sound("sounds/background.ogg"),
  bullet: sound("sounds/bullet.mp3"),
  earthExplode: sound("sounds/earth_explode.mp3"),
  earthGone: sound("sounds/earth_gone.mp3"),
  enemyActivate: sound("sounds/enemy_activate.mp3"),
  enemyDeactivate: sound("sounds/enemy_deactivate.mp3"),
  enemyBullet: sound("sounds/enemy_bullet.mp3"),
  explode: sound("sounds/explode.mp3"),
  gameOver: sound("sounds/game_over.mp3"),
  poof: sound("sounds/poof.mp3"),
  rocketLoop: sound("sounds/rocket_loop.mp3"),
  thrusterLoop: sound("sounds/thruster_loop.mp3"),
};
