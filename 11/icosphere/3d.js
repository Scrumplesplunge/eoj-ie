// Vector class.

function Vector(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
}

Vector.prototype.neg = function() {
	return new Vector(
		-this.x,
		-this.y,
		-this.z
	);
}

Vector.prototype.add = function(v) {
	return new Vector(
		this.x + v.x,
		this.y + v.y,
		this.z + v.z
	);
}

Vector.prototype.sub = function(v) {
	return new Vector(
		this.x - v.x,
		this.y - v.y,
		this.z - v.z
	);
}

Vector.prototype.mul = function(s) {
	return new Vector(
		this.x * s,
		this.y * s,
		this.z * s
	);
}

Vector.prototype.dot = function(v) {
	return this.x * v.x + this.y * v.y + this.z * v.z;
}

Vector.prototype.cross = function(v) {
	return new Vector(
		this.y * v.z - this.z * v.y,
		this.z * v.x - this.x * v.z,
		this.x * v.y - this.y * v.x
	);
}

Vector.prototype.length = function() {
	return Math.sqrt(this.lengthSquared());
}

Vector.prototype.lengthSquared = function() {
	return this.x * this.x + this.y * this.y + this.z * this.z;
}

Vector.prototype.normalized = function() {
	return this.mul(1 / this.length());
}

Vector.prototype.toString = function() {
	return "[" + this.x + ", " + this.y + ", " + this.z + "]";
}

// Matrix class.

function Transformation() {
	this.a = new Vector(1, 0, 0);
	this.b = new Vector(0, 1, 0);
	this.c = new Vector(0, 0, 1);
	this.d = new Vector(0, 0, 0);
}

Transformation.prototype.translate = function(v) {
	this.d = this.d.add(v);
}

Transformation.prototype.rotateX = function(theta) {
	var c = Math.cos(theta), s = Math.sin(theta);
	var oldB = this.b, oldC = this.c;
	this.b = oldB.mul(c).sub(oldC.mul(s));
	this.c = oldB.mul(s).add(oldC.mul(c));
}

Transformation.prototype.rotateY = function(theta) {
	var c = Math.cos(theta), s = Math.sin(theta);
	var oldA = this.a, oldC = this.c;
	this.a = oldA.mul(c).add(oldC.mul(s));
	this.c = oldA.mul(-s).add(oldC.mul(c));
}

Transformation.prototype.rotateZ = function(theta) {
	var c = Math.cos(theta), s = Math.sin(theta);
	var oldA = this.a, oldB = this.b;
	this.a = oldA.mul(c).sub(oldB.mul(s));
	this.b = oldA.mul(s).add(oldB.mul(c));
}

Transformation.prototype.scale = function(v) {
	this.a = this.a.mul(v.x);
	this.b = this.b.mul(v.y);
	this.c = this.c.mul(v.z);
}

Transformation.prototype.apply = function(v) {
	return this.d.add(new Vector(v.dot(this.a), v.dot(this.b), v.dot(this.c)));
}
