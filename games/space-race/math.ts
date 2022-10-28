export class Vector {
  // Constructs a random vector with a two-dimensional normal distribution.
  static random() {
    const r = Math.sqrt(-2 * Math.log(1 - Math.random()));
    const theta = 2 * Math.PI * Math.random();
    return new Vector(r * Math.cos(theta), r * Math.sin(theta));
  }

  // Constructs a unit vector from an angle.
  static fromAngle(radians) {
    return new Vector(Math.cos(radians), Math.sin(radians));
  }

  constructor(public x: number, public y: number) {}

  neg(): Vector { return new Vector(-this.x, -this.y) }
  add(v: Vector): Vector { return new Vector(this.x + v.x, this.y + v.y) }
  sub(v: Vector): Vector { return new Vector(this.x - v.x, this.y - v.y) }
  mul(s: number): Vector { return new Vector(this.x * s, this.y * s) }
  dot(v: Vector): number { return this.x * v.x + this.y * v.y }
  cross(v: Vector): number { return this.x * v.y - this.y * v.x }
  len(): number { return Math.sqrt(this.dot(this)) }
  rot90(): Vector { return new Vector(-this.y, this.x) }
  norm(): Vector { return this.mul(1 / this.len()) }
}

export class Matrix {
  static rotate(theta: number): Matrix {
    const c = Math.cos(theta), s = Math.sin(theta);
    return new Matrix(new Vector(c, s), new Vector(-s, c));
  }

  static fromRows(a: Vector, b: Vector): Matrix {
    return new Matrix(new Vector(a.x, b.x), new Vector(a.y, b.y));
  }

  constructor(public a: Vector, public b: Vector) {}

  apply(v: Vector): Vector { return this.a.mul(v.x).add(this.b.mul(v.y)) }

  determinant(): number {
    return this.a.cross(this.b);
  }

  inverse(): Matrix {
    const d = this.determinant();
    if (d == 0) throw new Error('Inverting a non-invertible matrix');
    const k = 1 / d;
    return new Matrix(new Vector(k * this.b.y, k * -this.a.y),
                      new Vector(k * -this.b.x, k * this.a.x));
  }
}

const PI = Math.PI;
const TAU = 2 * PI;

export function angnorm(x: number): number {
  return ((x + PI) % TAU + TAU) % TAU - PI;
}
