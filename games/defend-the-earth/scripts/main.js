var canvas;
var display;
var font = new Font(images.text);
var soundtrack = sounds.background.repeat();

// Initialize the universe.
var universe = new Universe();
var earth = new Earth(new Vector(0, 0));
universe.add(earth);
var ship = new Ship(
    new Vector(Config.EARTH_RADIUS + Config.STARTING_ALTITUDE, 0));
universe.add(ship);

// Initialize enemies.
var enemiesKilled = 0;

function addEnemy(config) {
  var startingDirection = Vector.fromAngle(random(-Math.PI, Math.PI));
  var startingOffset = startingDirection.mul(
      Config.EARTH_RADIUS + Config.ENEMY_STARTING_ALTITUDE);
  var startingPosition = earth.position.add(startingOffset);
  var enemy = new Enemy(startingPosition, config);
  universe.add(enemy);
  return enemy;
}

var wave = 0;
function enemiesInWave(wave) {
  return clamp(3 + wave, 5, 10);
}
function enemyOptionForWave(wave) {
  var size = 10 + random(0, 5 * wave);
  return new EnemyOptions().setSize(size).setHealth(6 * size);
}
function nextWave() {
  wave++;
  var n = enemiesInWave(wave);
  for (var i = 0; i < n; i++) {
    var enemy = addEnemy(enemyOptionForWave(wave));
    enemy.on("destroyed", function() {
      enemiesKilled++;
      // When the enemy is killed, move towards the next wave.
      n--;
      if (n == 0) nextWave();
    });
  }
}
nextWave();

// Compute the velocity required for the ship to be in a (roughly) circular
// orbit.
var a = Universe.gravity(earth, ship).len() / ship.mass;
ship.velocity.y = Math.sqrt(ship.position.x * a);
ship.angularVelocity = ship.velocity.y / ship.position.x;

// When the size of the browser window changes, update the dimensions of the
// canvas.
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}

function showStats(ctx) {
  ctx.save();
    font.color = "#ffffff";
    ctx.save();
      font.color = "#ffffff";
      ctx.translate(font.drawAndMeasure(ctx, "ENEMIES KILLED: "), 0);
      font.color = "#ffff00";
      font.draw(ctx, enemiesKilled.toString());
    ctx.restore();
    ctx.translate(0, 1);
    ctx.save();
      font.color = "#ffffff";
      ctx.translate(font.drawAndMeasure(ctx, "WAVE: "), 0);
      font.color = "#ffff00";
      font.draw(ctx, wave.toString());
    ctx.restore();
  ctx.restore();
}

function showControls(ctx) {
  var controls = [
    ["THRUST", "W+S"],
    ["STRAFE", "A+D"],
    ["AIM", "MOUSE"],
    ["FIRE", "LEFT MOUSE"],
    ["ZOOM", "SCROLL"],
    ["LOOK", "RIGHT MOUSE"],
  ];
  controls.sort();
  ctx.save();
    for (var i = controls.length - 1; i >= 0; i--) {
      ctx.save();
        font.color = "#ffffff";
        ctx.translate(font.drawAndMeasure(ctx, controls[i][0] + ": "), 0);
        font.color = "#ffff00";
        font.draw(ctx, controls[i][1]);
      ctx.restore();
      ctx.translate(0, -1);
    }
  ctx.restore();
}

// Redraw the state of the world without modifying anything.
function draw() {
  display.clear();
  display.draw(ctx => universe.draw(ctx));
  var ctx = display.context;
  ctx.save();
    ctx.translate(20, 20);
    ctx.scale(20, 20);
    earth.showInfo(ctx, font);
    ctx.translate(0, 1);
    ship.showInfo(ctx, font);
    ctx.translate(0, 1);
    showStats(ctx);
  ctx.restore();
  ctx.save();
    ctx.translate(display.canvas.width - 20, 20);
    ctx.scale(20, 20);
    ctx.translate(-1, 0);
    font.color = soundtrack.paused ? "#ff0000" : "#00ff00";
    font.draw(ctx, soundtrack.paused ? "|" : "<");
    var message = "MUSIC (M): ";
    ctx.translate(-font.measure(message), 0);
    font.color = "#ffffff";
    font.draw(ctx, message);
  ctx.restore();
  ctx.save();
    ctx.translate(20, display.canvas.height - 40);
    ctx.scale(20, 20);
    showControls(ctx);
  ctx.restore();
}

window.addEventListener("keydown", function(event) {
  if (event.keyCode != Keys.M) return;
  if (soundtrack.paused) {
    soundtrack.play();
  } else {
    soundtrack.pause();
  }
});

// Update the state of the world.
function update() {
  display.update(Config.UPDATE_DELTA);
  universe.update(Config.UPDATE_DELTA);
  draw();
}

function main() {
  canvas = document.getElementById("screen");
  display = new Display(canvas);
  display.target = ship;

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  setInterval(update, 1000 * Config.UPDATE_DELTA);
}

window.addEventListener("load", main);
