var EPSILON = 1e-5;

function Vector(x, y, z, w) {
	this.x = x;
	this.y = y;
	this.z = z;
	this.w = (typeof w == "undefined") ? 1 : w;
}

Vector.prototype.add = function(v) {
	return new Vector(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
}

Vector.prototype.sub = function(v) {
	return new Vector(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w);
}

Vector.prototype.mul = function(s) {
	return new Vector(this.x * s, this.y * s, this.z * s, this.w);
}

Vector.prototype.squareLength = function() {
	return this.x * this.x + this.y * this.y + this.z * this.z;
}

Vector.prototype.length = function() {
	return Math.sqrt(this.squareLength());
}

Vector.prototype.dot = function(v) {
	return this.x * v.x + this.y * v.y + this.z * v.z;
}

Vector.prototype.cross = function(v) {
	return new Vector(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
}

Vector.prototype.normalized = function() {
	return this.mul(1 / this.length());
}

Vector.create = function(args) {
	return new Vector(args[0], args[1], args[2], args[3]);
}

function Matrix(mat) {
	this.mat = (typeof mat == "undefined") ? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] : mat;
}

Matrix.prototype.transform = function(v) {
	return new Vector(
		this.mat[0] * v.x + this.mat[1] * v.y + this.mat[2] * v.z + this.mat[3] * v.w,
		this.mat[4] * v.x + this.mat[5] * v.y + this.mat[6] * v.z + this.mat[7] * v.w,
		this.mat[8] * v.x + this.mat[9] * v.y + this.mat[10] * v.z + this.mat[11] * v.w,
		this.mat[12] * v.x + this.mat[13] * v.y + this.mat[14] * v.z + this.mat[15] * v.w
	);
}

Matrix.prototype.flipMul = function(m) {
	var a = m.transform(new Vector(this.mat[0], this.mat[4], this.mat[8], this.mat[12]));
	var b = m.transform(new Vector(this.mat[1], this.mat[5], this.mat[9], this.mat[13]));
	var c = m.transform(new Vector(this.mat[2], this.mat[6], this.mat[10], this.mat[14]));
	var d = m.transform(new Vector(this.mat[3], this.mat[7], this.mat[11], this.mat[15]));
	return new Matrix([
		a.x, b.x, c.x, d.x,
		a.y, b.y, c.y, d.y,
		a.z, b.z, c.z, d.z,
		a.w, b.w, c.w, d.w
	]);
}

Matrix.prototype.mul = function(m) {
	return m.flipMul(this);
}

function Ray(origin, direction) {
	this.origin = origin;
	this.direction = direction.normalized();
}

function Parallelogram(a, b, c, mat) {
	this.a = a;
	this.b = b;
	this.c = c;
	this.material = mat;
}

Parallelogram.create = function(args) {
	return new Parallelogram(args[0], args[1], args[2], args[3]);
}

Parallelogram.prototype.translateIndex = function(x) {
	return new Parallelogram(this.a + x, this.b + x, this.c + x, this.material);
}

Parallelogram.prototype.trace = function(ray, vertices, res) {
	// Same as triangle intersection test, but with different bounds on U and V.
	var A = vertices[this.a];
	var B = vertices[this.b];
	var C = vertices[this.c];

	// Edges.
	var ab = B.sub(A);
	var ac = C.sub(A);

	// Calculate the determinant.
	var pvec = ray.direction.cross(ac);
	var det = ab.dot(pvec);

	// Either ray came from behind, or ray missed unit square after transform.
	if (det <= EPSILON) return false;

	// Calculate distance to ray origin.
	var tvec = ray.origin.sub(A);

	// Calculate U component.
	res.u = tvec.dot(pvec);

	// Ray went out of bounds with the U component.
	if (res.u < 0 || det < res.u) return false;

	// Prepare to test V parameter.
	var qvec = tvec.cross(ab);

	// Calculate V component.
	res.v = ray.direction.dot(qvec);

	// Ray missed the triangle.
	if (res.v < 0 || det < res.v) return false;
	
	// Calculate T and scale parameters.
	res.t = ac.dot(qvec);
	var idet = 1 / det;
	res.t *= idet;
	res.u *= idet;
	res.v *= idet;
	res.shape = this;
	
	// Ray hit, so smile and be happy.
	return true;
}

Parallelogram.prototype.normal = function(vtx) {
	var A = vtx[this.a], B = vtx[this.b], C = vtx[this.c];
	return B.sub(A).cross(C.sub(A)).normalized();
}

Parallelogram.prototype.vertices = function() {
	return [this.a, this.b, this.c];
}

function Triangle(a, b, c, mat) {
	this.a = a;
	this.b = b;
	this.c = c;
	this.material = mat;
}

Triangle.create = function(args) {
	return new Triangle(args[0], args[1], args[2], args[3]);
}

Triangle.prototype.translateIndex = function(x) {
	return new Triangle(this.a + x, this.b + x, this.c + x, this.material);
}

Triangle.prototype.trace = function(ray, vertices, res) {
	var A = vertices[this.a];
	var B = vertices[this.b];
	var C = vertices[this.c];

	// Edges.
	var ab = B.sub(A);
	var ac = C.sub(A);

	// Calculate the determinant.
	var pvec = ray.direction.cross(ac);
	var det = ab.dot(pvec);

	// Either ray came from behind, or ray missed unit square after transform.
	if (det <= EPSILON) return false;

	// Calculate distance to ray origin.
	var tvec = ray.origin.sub(A);

	// Calculate U component.
	res.u = tvec.dot(pvec);

	// Ray went out of bounds with the U component.
	if (res.u < 0 || det < res.u) return false;

	// Prepare to test V parameter.
	var qvec = tvec.cross(ab);

	// Calculate V component.
	res.v = ray.direction.dot(qvec);

	// Ray missed the triangle.
	if (res.v < 0 || res.u + res.v > det) return false;
	
	// Calculate T and scale parameters.
	res.t = ac.dot(qvec);
	var idet = 1 / det;
	res.t *= idet;
	res.u *= idet;
	res.v *= idet;
	res.shape = this;
	
	// Ray hit, so smile and be happy.
	return true;
}

Triangle.prototype.normal = function(vtx) {
	var A = vtx[this.a], B = vtx[this.b], C = vtx[this.c];
	return B.sub(A).cross(C.sub(A)).normalized();
}

Triangle.prototype.vertices = function() {
	return [this.a, this.b, this.c];
}

function Group(vertices, shapes) {
	this.shapes = shapes;
	this.calculateBounds(vertices);
}

Group.prototype.calculateBounds = function(vertices) {
	// Find the min and max values.
	var minX, minY, minZ, maxX, maxY, maxZ;
	minX = minY = minZ = Infinity;
	maxX = maxY = maxZ = -Infinity;

	for (var i = 0, n = shapes.length; i < n; i++) {
		var vtx = shapes[i].vertices();
		for (var j = 0, m = vtx.length; j < m; j++) {
			var v = vertices[vtx[j]];
			minX = Math.min(minX, v.x);
			minY = Math.min(minY, v.y);
			minZ = Math.min(minZ, v.z);
			maxX = Math.max(maxX, v.x);
			maxY = Math.max(maxY, v.y);
			maxZ = Math.max(maxZ, v.z);
		}
	}

	// Choose the centre of this bounding box.
	this.center = vertices.length;
	var c = new Vector(0.5 * (minX + maxX), 0.5 * (minY + maxY), 0.5 * (minZ + maxZ));
	vertices.push(c);

	// Find a bounding radius.
	var maxSquareRadius = 0;
	for (var i = 0, n = shapes.length; i < n; i++) {
		var vtx = shapes[i].vertices();
		for (var j = 0, m = vtx.length; j < m; j++) {
			var v = vertices[vtx[j]];
			maxSquareRadius = Math.max(maxSquareRadius, v.sub(c).squareLength());
		}
	}

	// Choose the least upper bound as the radius.
	this.squareRadius = maxSquareRadius;
	this.radius = Math.sqrt(this.squareRadius);
}

Group.prototype.translateIndex = function(x) {
	var sh = [];
	for (var i = 0, n = this.shapes.length; i < n; i++) {
		sh[i] = this.shapes[i].translateIndex(x);
	}
	var out = new Group([], []);
	out.shapes = sh;
	out.center = this.center;
	out.squareRadius = this.squareRadius;
	out.radius = this.radius;
}

Group.prototype.trace = function(ray, vertices, res) {
	// Group check.
	if (ray.direction.cross(vertices[this.center].sub(ray.origin)).squareLength() > this.squareRadius) {
		return false;
	} else {
		return trace(ray, vertices, this.shapes, res);
	}
}

function trace(ray, vertices, shapes, result) {
	var temp = {t : Infinity, u : 0, v : 0};
	var best = {t : Infinity, u : 0, v : 0, shape : null};

	for (var i = 0, n = shapes.length; i < n; i++) {
		// Check if the ray hit the triangle, and was closest.
		if (shapes[i].trace(ray, vertices, temp) && 0 < temp.t && temp.t < best.t) {
			// Better triangle found.
			best.t = temp.t;
			best.u = temp.u;
			best.v = temp.v;
			best.shape = temp.shape;
		}
	}

	for (var i in best) if (best.hasOwnProperty(i)) result[i] = best[i];
	return best.shape != null;
}
