// When writing async interfaces, it is easier to reason about them if you know
// for certain that the callback will not run until the caller has finished
// executing. By scheduling the callback using setTimeout, we guarantee this.
function schedule(callback) {
  setTimeout(callback, 0);
}

// Load an image and run a callback once it is loaded.
function loadImage(name, callback) {
  var image = new Image();
  image.onload = callback;
  image.src = name;
  return image;
}

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  neg() { return new Vector(-this.x, -this.y); }
  add(v) { return new Vector(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector(this.x - v.x, this.y - v.y); }
  mul(s) { return new Vector(this.x * s, this.y * s); }
  div(s) { return new Vector(this.x / s, this.y / s); }
  dot(v) { return this.x * v.x + this.y * v.y; }
  squareLength() { return this.dot(this); }
  length() { return Math.sqrt(this.squareLength()); }
  normalized() { return this.div(this.length()); }
  rotate90() { return new Vector(-this.y, this.x); }
  static random() {
    var r = Math.sqrt(-2 * Math.log(1 - Math.random()));
    var theta = 2 * Math.PI * Math.random();
    return new Vector(r * Math.sin(theta), r * Math.cos(theta));
  }
}

// Remove elements from an array which satisfy a predicate. Linear time.
function removeIf(predicate, container) {
  var j = 0;
  for (var i = 0, n = container.length; i < n; i++) {
    if (!predicate(container[i])) {
      container[j] = container[i];
      j++;
    }
  }
  container.splice(j);
}

Array.prototype.random = function() {
  return this[Math.floor(this.length * Math.random())];
}
