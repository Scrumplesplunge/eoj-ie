var MouseButtons = {
  LEFT: 1,
  RIGHT: 2,
};

var Keys = {
  SHIFT: 16,
  CONTROL: 17,
  SPACE: 32,
  A: 65,
  D: 68,
  M: 77,
  S: 83,
  W: 87,
};

// Return a random value in the range [a, b).
function random(a, b) { return a + Math.random() * (b - a); }

// Return a random entry from an array.
Array.prototype.randomEntry = function() {
  return this[Math.floor(Math.random() * this.length)];
};

// Return the value of a clamped to the range [b, c].
function clamp(a, b, c) {
  return Math.min(Math.max(a, b), c);
}

var TWO_PI = 2 * Math.PI;
function angnorm(a) {
  return (a % TWO_PI + TWO_PI) % TWO_PI;
}

// Draw an image on the canvas which is centered at the given position.
function drawSprite(ctx, image, position, angle, w, h) {
  ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(angle);
    ctx.drawImage(image, -0.5 * w, -0.5 * h, w, h);
  ctx.restore();
}

function getOrDefault(object, fallback, key) {
  return object.hasOwnProperty(key) ? object[key] : fallback[key];
}
