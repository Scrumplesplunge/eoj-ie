About 5 years ago, I created what I thought to be a pretty cool fractal, and
made it draw itself in a pretty cool way. Today, I dug up that old code and
rewrote it to make it a little more efficient. I also took extended the process
from filling in a single triangle, to filling in a fractal of triangles.
A triangle fractal of circle fractals. Anyway, I thought it might be worth
sharing:

<script>
  (function() {
    var MIN_RADIUS = 0.05;
    var FRAME_RATE = 50;
    var DRAW_SPEED = 100;
    var TWO_PI = 2 * Math.PI;

    // Create the canvas element immediately before the script tag.
    var canvas = document.createElement("canvas");
    canvas.style.width = "100%";

    var script = document.currentScript;
    var parent = script.parentElement;
    parent.insertBefore(canvas, script);

    // Set up the rendering context.
    var context = canvas.getContext("2d");

    function angnorm(angle) { return ((angle % TWO_PI) + TWO_PI) % TWO_PI }

    function angleInRange(angle, start, end) {
      return (start < end && start <= angle && angle < end) ||
             (end < start && (start <= angle || angle < end));
    }

    function random(min_value, max_value) {
      return Math.random() * (max_value - min_value) + min_value;
    }

    function Vector(x, y) { this.x = x; this.y = y }
    Vector.prototype.add = function(v) {
      return new Vector(this.x + v.x, this.y + v.y);
    };
    Vector.prototype.sub = function(v) {
      return new Vector(this.x - v.x, this.y - v.y);
    };
    Vector.prototype.mul = function(s) {
      return new Vector(this.x * s, this.y * s);
    };
    Vector.prototype.div = function(s) {
      return new Vector(this.x / s, this.y / s);
    };
    Vector.prototype.length = function() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Vector.prototype.normalized = function() {
      return this.div(this.length());
    };
    Vector.prototype.negate = function() {
      return new Vector(-this.x, -this.y);
    };
    Vector.prototype.bearing = function() {
      return angnorm(Math.atan2(this.y, this.x));
    };
    // Generate a random vector within [min_x, max_x) * [min_y, max_y).
    Vector.random = function(min_x, min_y, max_x, max_y) {
      return new Vector(random(min_x, max_x), random(min_y, max_y));
    };
    function dot(a, b) { return a.x * b.x + a.y * b.y }
    function cross(a, b) { return a.x * b.y - a.y * b.x }

    function Triangle(a, b, c) { this.a = a; this.b = b; this.c = c }
    Triangle.prototype.area = function() {
      var p = this.b.sub(this.a);
      var q = this.c.sub(this.a);
      return 0.5 * Math.abs(cross(p, q));
    };
    // Generate a random triangle within [0, width) * [0, height).
    Triangle.random = function(width, height) {
      return new Triangle(Vector.random(0, 0, width, height),
                          Vector.random(0, 0, width, height),
                          Vector.random(0, 0, width, height));
    }

    function Square(position, a, b) {
      this.position = position;
      this.a = a; this.b = b;
      this.size = this.a.length();
    }
    Square.prototype.vertex = function(n) {
      switch (n) {
        case 1: return this.position;
        case 2: return this.position.add(this.a);
        case 3: return this.position.add(this.a).add(this.b);
        case 4: return this.position.add(this.b);
      }
    };

    function Circle(position, radius, child_generator) {
      this.position = position;
      this.radius = radius;

      // Child circles of this circle.
      this.children_generated = false;
      this.child_generator = child_generator;
      this.children = [];

      // Start angle of this circle, used for drawing the circle.
      // This will be populated once the circle is added to its parent.
      this.angle = 0;

      // The angle range which needs to be rendered in this frame, relative
      // to the start angle.
      this.in_render_queue = false;
      this.draw_clockwise = true;
      this.old_stage = this.stage = -Math.PI;
    }

    // Add a child circle to this circle.
    Circle.prototype.add = function(circle) {
      var offset = circle.position.sub(this.position);
      circle.angle = offset.bearing();
      this.children.push(circle);
    };
    Circle.prototype.getChildren = function() {
      if (!this.children_generated) {
        this.child_generator();
        this.children_generated = true;
      }
      return this.children;
    };

    // Generate the circle which is tangential to ab, bc, and ca.
    function recurseInsideTriangle(a, b, c) {
      // Compute the side lengths.
      var ab = b.sub(a).length();
      var bc = c.sub(b).length();
      var ca = a.sub(c).length();

      // Compute the location of the circle which touches all three sides.
      // Note that this is not the same as the mass-centre of the triangle.
      var perimeter = ab + bc + ca;
      var center = c.mul(ab).add(a.mul(bc)).add(b.mul(ca)).div(perimeter);

      // Compute the circle radius.
      var s = 0.5 * perimeter;
      var radius = Math.sqrt((s - ab) * (s - bc) * (s - ca) / s);

      // Generate child circles.
      var circle = new Circle(center, radius, function() {
        recurseInsideLineLineCurve(a, b, c, this);
        recurseInsideLineLineCurve(b, c, a, this);
        recurseInsideLineLineCurve(c, a, b, this);
      });
      return circle;
    }

    // Generate the circle which is tangential to ab, bc, and circle.
    function recurseInsideLineLineCurve(a, b, c, circle) {
      var da = circle.position.sub(a);
      var distance = da.length();

      // The size and position of the new circle can be calculated through
      // similar triangles generated from the vertex b, the tangent point
      // between side ab and the circle, and the centre of the circle.
      var ratio = (distance - circle.radius) / (distance + circle.radius);
      var radius = circle.radius * ratio;

      if (radius < MIN_RADIUS) return;

      var center = a.add(da.mul(ratio));
      var new_circle = new Circle(center, radius, function() {
        recurseInsideLineLineCurve(a, b, c, this);
        recurseInsideLineCurveCurve(b, a, circle, this);
        recurseInsideLineCurveCurve(c, a, circle, this);
      });
      new_circle.draw_clockwise = !circle.draw_clockwise;

      circle.add(new_circle);
    }

    // Generate a circle which is tangential to ab, circle_1, and circle_2.
    // circle_1 and circle_2 should be arranged such that we would find
    // circle_1 before circle_2 if traversing along ab. The new circle will
    // a child of circle_2.
    function recurseInsideLineCurveCurve(a, b, circle_1, circle_2) {
      var r1 = circle_1.radius, r2 = circle_2.radius;
      var radius = r1 * r2 / Math.pow(Math.sqrt(r1) + Math.sqrt(r2), 2);
      if (radius < MIN_RADIUS) return;

      var ab = b.sub(a).normalized();
      var ab_perp = new Vector(-ab.y, ab.x);

      // Ensure that ab_perp points towards circle_1.
      if (dot(ab_perp, circle_1.position.sub(a)) < 0)
        ab_perp = ab_perp.negate();

      var x = Math.sqrt(Math.pow(r1 + radius, 2) -
                        Math.pow(r1 - radius, 2));
      var y = radius - r1;
      var center = circle_1.position.add(ab.mul(x)).add(ab_perp.mul(y));

      var new_circle = new Circle(center, radius, function() {
        recurseInsideCurveCurveCurve(circle_1, circle_2, this);
        recurseInsideLineCurveCurve(a, b, circle_1, this);
        recurseInsideLineCurveCurve(b, a, circle_2, this);
      });
      new_circle.draw_clockwise = !circle_2.draw_clockwise;

      circle_2.add(new_circle);
    }

    // Generate a circle which is tangential to all three of the circles
    // that are provided. The new circle will be a child of circle_3.
    function recurseInsideCurveCurveCurve(
        circle_1, circle_2, circle_3) {
      var r1 = circle_1.radius, r2 = circle_2.radius, r3 = circle_3.radius;
      var p = r1 * r2 * r3;
      var q1 = r1 * r2 + r2 * r3 + r3 * r1;
      var q2 = 2 * Math.sqrt(p * (r1 + r2 + r3));
      var radius = p / (q1 + q2);

      if (radius < MIN_RADIUS) return;

      // Let ABC be a triangle where A is circle_1.position, B is
      // circle_2.position, and C is new_circle.position. Using the lengths
      // of the sides of ABC, compute C.
      var ab = circle_1.radius + circle_2.radius;
      var bc = circle_2.radius + radius;
      var ca = circle_1.radius + radius;

      // Use the cosine rule to compute angle BAC.
      var cos_bac = (ca * ca + ab * ab - bc * bc) / (2 * ca * ab);

      var vab = circle_2.position.sub(circle_1.position).normalized();
      var vab_perp = new Vector(-vab.y, vab.x);

      // Ensure that vab_perp points towards circle_3.
      if (dot(vab_perp, circle_3.position.sub(circle_1.position)) < 0)
        vab_perp = vab_perp.negate();

      var x = ca * cos_bac;
      var y = ca * Math.sin(Math.acos(cos_bac));
      var center = circle_1.position.add(vab.mul(x)).add(vab_perp.mul(y));

      var new_circle = new Circle(center, radius, function() {
        recurseInsideCurveCurveCurve(circle_1, circle_2, this);
        recurseInsideCurveCurveCurve(circle_2, circle_3, this);
        recurseInsideCurveCurveCurve(circle_3, circle_1, this);
      });
      new_circle.draw_clockwise = !circle_3.draw_clockwise;
      circle_3.add(new_circle);
    }

    function generateCirclesInTriangle(triangle) {
      // Generate the circle fractal.
      var root = recurseInsideTriangle(triangle.a, triangle.b, triangle.c);
      var ab = triangle.b.sub(triangle.a);
      var ab_perp = new Vector(-ab.y, ab.x);
      var ad = root.position.sub(triangle.a);

      // Pick a random start angle.
      root.angle = random(0, TWO_PI);
      
      return root;
    }

    function generateSubSquare(square) {
      var theta = Math.atan(1/4);
      var s = square.size, l = s * Math.cos(theta);
      var a = l * Math.cos(theta), b = l * Math.sin(theta);

      var x = square.a.normalized(), y = square.b.normalized();
      var position = x.mul(a).add(y.mul(b)).add(square.position);
      var p = x.mul(s - a - b).add(y.mul(a - b));
      var q = x.mul(b - a).add(y.mul(s - a - b));
      return new Square(position, p, q);
    }

    // Animation state.
    var render_queue = [];
    var prepare_next_level = function() {};
    var tick_interval = 0;

    function generateCirclesInSquare(square) {
      // Generate triangles such that four of them fit together to leave
      // a square hole in the centre.
      var sub_square = generateSubSquare(square);
      var p1 = square.vertex(1), p2 = square.vertex(2),
          p3 = square.vertex(3), p4 = square.vertex(4);
      var q1 = sub_square.vertex(1), q2 = sub_square.vertex(2),
          q3 = sub_square.vertex(3), q4 = sub_square.vertex(4);

      var root_1 = generateCirclesInTriangle(new Triangle(p1, p2, q1));
      var root_2 = generateCirclesInTriangle(new Triangle(p2, p3, q2));
      var root_3 = generateCirclesInTriangle(new Triangle(p3, p4, q3));
      var root_4 = generateCirclesInTriangle(new Triangle(p4, p1, q4));

      render_queue = [root_1, root_2, root_3, root_4];
      root_1.in_render_queue = true;
      root_2.in_render_queue = true;
      root_3.in_render_queue = true;
      root_4.in_render_queue = true;

      prepare_next_level = function() {
        if (sub_square.size > MIN_RADIUS) {
          generateCirclesInSquare(sub_square);
        } else {
          // Animation is complete.
          clearInterval(tick_interval);
        }
      };
    }

    function init() {
      var pixel_ratio = window.devicePixelRatio;
      var size = pixel_ratio * canvas.clientWidth;
      var width = canvas.width = size;
      var height = canvas.height = size;

      var initial_square = new Square(
          new Vector(0, 0), new Vector(size, 0), new Vector(0, size));
      generateCirclesInSquare(initial_square);

      tick_interval = setInterval(tick, 1000 / FRAME_RATE);
    }

    function color(angle) {
      var hue = Math.floor(720 * angle / TWO_PI) % 360;
      return "hsl(" + hue + ", 100%, 60%)";
    }

    function tick() {
      var delta_time = 1 / FRAME_RATE;

      if (render_queue.length == 0) prepare_next_level();

      var old_length = render_queue.length;
      var n = old_length;
      for (var i = n; i-- > 0;) {
        var circle = render_queue[i];
        if (circle.stage >= Math.PI) {
          // This circle is complete.
          n--;
          render_queue[i] = render_queue[n];
          continue;
        }

        // Update the circle.
        circle.old_stage = circle.stage;
        circle.stage += DRAW_SPEED * delta_time / circle.radius;

        var a, b;
        if (circle.draw_clockwise) {
          a = angnorm(circle.angle + circle.old_stage);
          b = angnorm(circle.angle + circle.stage);
        } else {
          a = angnorm(circle.angle - circle.stage);
          b = angnorm(circle.angle - circle.old_stage);
        }

        // Check if any of the child nodes need to be added to the render
        // queue.
        var children = circle.getChildren();
        for (var j = 0, m = children.length; j < m; j++) {
          var child = children[j];
          if (!child.in_render_queue && angleInRange(child.angle, a, b)) {
            render_queue.push(child);
            child.in_render_queue = true;
          }
        }
      }
      // Cut out the elements which are complete.
      render_queue.splice(n, old_length - n);

      // Render each circle.
      for (var i = 0, n = render_queue.length; i < n; i++) {
        var circle = render_queue[i];
        var start, end;
        if (circle.draw_clockwise) {
          start = circle.angle + circle.old_stage;
          end = circle.angle + circle.stage;
        } else {
          start = circle.angle - circle.old_stage;
          end = circle.angle - circle.stage;
        }
        context.strokeStyle = color((start + end) / 2);
        context.beginPath();
        context.arc(circle.position.x, circle.position.y,
                    circle.radius, start, end, !circle.draw_clockwise);
        context.stroke();
      }
    }

    init();
  }());
</script>
