I'm currently implementing a game engine as a hobby project and I am now
implementing GJK for the first time after learning about it at university over
a decade ago. To wrap my head around it, I decided to implement it in 2D first
and share it here.

The problem we want to solve is to detect whether two convex[^convex] shapes are
intersecting and, if they are, identify a contact point and a separation vector
which we can use for resolving the collision. This problem is equivalent to
checking whether the [Minkowski Difference][minkowski] of the two shapes
contains the origin point. The separation vector is equal to the vector from the
origin to the closest point on the surface of the Minkowski difference, and the
contact point can be found by reconstructing the points on the two shapes which
generated that point on the surface of the Minkowski difference.

GJK handles collision detection by searching for a subset of the Minkowski
Difference which contains the origin. More specifically, each subset it
considers is a *simplex* consisting of 1-3 vertices which form a point, a line,
or a triangle within the Minkowski Difference. In 3D, we would have 1-4 vertices
and additionally consider tetrahedrons. The algorithm either terminates having
found a [separating axis][axis] signifying that there is no intersection, or by
finding a simplex of 3 points that contain the origin.

However, that's not everything we need. We still don't know the contact point or
the separation vector, all we have is some simplex inside the Minkowski
difference. To find the separation vector, we have to use a second algorithm
called the *Expanding Polytope Algorithm*. This algorithm iteratively expands
GJK's final simplex by searching outwards from the face which is closest to the
origin until it reaches the surface of the Minkowski difference and can't search
any further.

Without further ado, here's the demo:

<script>
  (() => {
    // Functions for vector arithmetic.
    function vec(x, y) { return {x, y} }
    function dot(a, b) { return a.x * b.x + a.y * b.y }
    function neg(v) { return {x: -v.x, y: -v.y} }
    function add(a, b) { return {x: a.x + b.x, y: a.y + b.y} }
    function sub(a, b) { return {x: a.x - b.x, y: a.y - b.y} }
    function mul(v, s) { return {x: v.x * s, y: v.y * s} }
    function rot90(v) { return {x: -v.y, y: v.x} }
    function norm(v) { return mul(v, 1 / Math.sqrt(dot(v, v))) }

    // Generate a regular polygon with the given centre and rotation.
    function regularPolygon(numVertices, center, angle) {
      const result = [];
      const stride = 2 * Math.PI / numVertices;
      for (let i = 0; i < numVertices; i++) {
        const theta = angle + i * stride;
        const c = Math.cos(theta), s = Math.sin(theta);
        result.push({x: center.x + c, y: center.y + s});
      }
      return result;
    }
    const triangle = (c, a) => regularPolygon(3, c, a);
    const pentagon = (c, a) => regularPolygon(5, c, a);

    // Compute the support point for a set of vertices in a given direction.
    function support(vertices, d) {
      let best = vertices[0], bestDot = dot(vertices[0], d);
      for (let i = 1, n = vertices.length; i < n; i++) {
        const x = dot(vertices[i], d);
        if (x > bestDot) {
          bestDot = x;
          best = vertices[i];
        }
      }
      return best;
    }

    // Calculate the support point for the Minkowski difference of two shapes in
    // a given direction.
    const minkowskiSupport = (a, b) => d => {
      const va = support(a, d);
      const vb = support(b, neg(d));
      // The actual support point is `position`, but we also return the support
      // points from the individual shapes as these are needed for calculating
      // the contact point later.
      return {a: va, b: vb, position: sub(va, vb)};
    };

    // Detects whether two objects are intersecting based on a `support`
    // function representing the Minkowski Difference of the two shapes.
    //
    // If the objects are intersecting, returns a triangle consisting of three
    // vertices of the Minkowski Difference and containing the origin. If the
    // objects are not intersecting, returns `null`.
    function gjk(support) {
      let d;
      let simplex;

      {
        // We need a starting point for the initial simplex, as well as a search
        // direction. We can find a starting point by searching for a support
        // point in any arbitrary direction, and we can then search back towards
        // the origin from that point to find a second one.
        const a = support(vec(1, 0));
        const b = support(neg(a.position));
        if (dot(a.position, b.position) > 0) return null;
        const n = rot90(sub(b.position, a.position));
        const forward = dot(a.position, n) < 0;
        d = forward ? n : neg(n);
        // We always orient an edge simplex so that rot90(sub(b, a)) points
        // towards the origin. This saves us from having to check this for each
        // triangle simplex.
        simplex = forward ? [a, b] : [b, a];
      }

      while (true) {
        const [a, b] = simplex;
        const c = support(d);
        // Our search direction `d` is always towards the origin. If we didn't
        // go beyond the origin with the new support point, it means that the
        // origin is outside of the Minkowski difference and we can return.
        if (dot(c.position, d) < 0) return null;

        // Otherwise, we need to update the simplex and search direction. If the
        // triangle contains the origin, we're done. Otherwise, the closest
        // simplex will be one of the triangle's new edges:
        //   * It can't be either `a` or `b` by induction, with the base
        //     case being the line case above and the inductive case being
        //     the two edge cases below.
        //   * It can't be `c` because we passed the origin on the way to
        //     `c` from edge `(a, b)`, making either `(a, c)` or `(b, c)`
        //     closer.
        //   * It can't be the old edge `(a, b)` because we started
        //     searching by moving away from that edge.
        // So, we only have to check edges `(a, c)` and `(b, c)`.
        const ab = sub(b.position, a.position);
        // Calculate the normals for the two edges, facing out of the
        // triangle.
        let acNorm = rot90(sub(c.position, a.position));
        let bcNorm = rot90(sub(b.position, c.position));
        if (dot(c.position, acNorm) < 0) {
          // In front of `(a, c)`.
          simplex = [a, c];
          d = acNorm;
        } else if (dot(c.position, bcNorm) < 0) {
          // In front of `(b, c)`.
          simplex = [c, b];
          d = bcNorm;
        } else {
          // The triangle contains the origin, so there's an intersection.
          return [a, b, c];
        }
      }
    }

    // Given a `support` function representing the Minkowski Difference of two
    // shapes and an `initial` simplex consisting of vertices from the Minkowski
    // Difference and containing the origin, the Expanding Polytope Algorithm
    // finds the collision point and separation vector for the intersection.
    function epa(support, initial) {
      // The algorithm gradually expands a convex polytope (in 2D, this is just
      // a polygon) until it reaches the surface of the Minkowski Difference
      // which is closest to the origin. Initially, we start with the simplex
      // produced by GJK.
      //
      // The representation we're using here is a list of faces. Each face
      // caches its distance from the origin as well as the normal direction
      // facing away from the origin.
      function makeFace(p, q) {
        const normal = norm(rot90(sub(p.position, q.position)));
        return {p, q, normal, distance: dot(q.position, normal)};
      }
      const polytope = [];
      {
        const [a, b, c] = initial;
        for (const [p, q] of [[a, b], [b, c], [c, a]]) {
          polytope.push(makeFace(p, q));
        }
      }
      while (true) {
        // Find the polytope face which is closest to the origin.
        let minFace = 0;
        for (let i = 1; i < polytope.length; i++) {
          if (polytope[i].distance < polytope[minFace].distance) minFace = i;
        }
        const f = polytope[minFace];
        // Search outwards from that face in the direction of the normal. If we
        // don't find anything beyond the face, we're already at the edge of the
        // Minkowski Difference and we can return. Otherwise, we replace the
        // face with new ones formed from the new support point and repeat.
        const v = support(f.normal);
        const d = dot(v.position, f.normal);
        if (d - f.distance < 1e-5) {
          // The new point is (close enough to being) on the surface of the
          // face, so we're done. We can find the separation vector by
          // projecting the origin onto the face, and we can find the contact
          // points by interpolating between the world-space coordinates
          // corresponding to each of the Minkowski Difference vertices.
          const qp = sub(f.p.position, f.q.position);
          const t = dot(f.p.position, qp) / dot(qp, qp);
          const sep = add(mul(f.p.position, 1 - t), mul(f.q.position, t));
          const a = add(mul(f.p.a, 1 - t), mul(f.q.a, t));
          const b = add(mul(f.p.b, 1 - t), mul(f.q.b, t));
          return {polytope, a, b, sep};
        }
        // Otherwise, we need to update the polytope. In 2D, we can simply
        // replace one edge with two.
        polytope[minFace] = makeFace(f.p, v);
        polytope.push(makeFace(v, f.q));
      }
    }

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.width = 1024;
    canvas.height = 640;
    document.currentScript.parentElement.insertBefore(
        canvas, document.currentScript);
    const context = canvas.getContext('2d');

    function trace(vertices) {
      const last = vertices[vertices.length - 1];
      context.moveTo(last.x, last.y);
      for (const v of vertices) {
        context.lineTo(v.x, v.y);
      }
    }

    const a = pentagon(vec(0, -3), 0);
    let t = 5.6;  // Chosen to be an interesting intersection.
    let rate = 1;
    function tick(dt) {
      t += rate * dt;
      window.t = t;
      const b = triangle(vec(2 * Math.sin(t), -3), Math.sqrt(2) * t);
      const s = minkowskiSupport(a, b);
      const collision = gjk(s);

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
        // Zoom the canvas in on the demo.
        context.translate(0.5 * canvas.width, 0.5 * canvas.height);
        const scale = 0.1 * canvas.width;
        context.lineWidth = 1 / scale;
        context.scale(scale, scale);
        context.translate(0, 1);

        // Draw the objects.
        context.strokeStyle = collision ? '#0f0' : '#f00';
        context.beginPath();
          trace(a);
          trace(b);
        context.stroke();

        if (collision) {
          // Draw the collision simplex in cyan.
          context.strokeStyle = '#0ff';
          context.beginPath();
            context.moveTo(0, 0);
            context.arc(0, 0, 0.01, 0, 2 * Math.PI);
            trace(collision.map(v => v.position));
          context.stroke();

          const contact = epa(s, collision);
          // Draw the output of EPA in yellow.
          context.strokeStyle = '#ff0';
          context.beginPath();
            // Draw the final polytope which we explored, which is some subset
            // of the Minkowski Difference which definitely includes the edge
            // of the Minkowski Difference that is closest to the origin.
            for (const {p, q, normal} of contact.polytope) {
              context.moveTo(p.position.x, p.position.y);
              context.lineTo(q.position.x, q.position.y);
            }

            // Draw the separation vector on the polytope.
            const {a, b, sep} = contact;
            context.moveTo(0, 0);
            context.lineTo(sep.x, sep.y);

            // Draw the contact points on the two shapes, plus a copy of the
            // separation vector between them.
            context.moveTo(a.x + 0.05, a.y);
            context.arc(a.x, a.y, 0.05, 0, 2 * Math.PI);
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.moveTo(b.x + 0.05, b.y);
            context.arc(b.x, b.y, 0.05, 0, 2 * Math.PI);
          context.stroke();

          // Draw dotted lines between the two separation vectors.
          context.setLineDash([0.02, 0.1]);
          context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(sep.x, sep.y);
            context.moveTo(0, 0);
            context.lineTo(b.x, b.y);
          context.stroke();
        }
      context.restore();
    }
    const DELTA_TIME = 0.01;
    let timer = 0;
    function updateTimer() {
      if (rate && timer == 0) {
        timer = setInterval(() => tick(DELTA_TIME), 1000 * DELTA_TIME);
      } else if (rate == 0 && timer) {
        clearInterval(timer);
        timer = 0;
      }
    }
    tick(0);

    // Make it so that we can use arrow keys to override the flow of time in the
    // demo, so it is easier to look at a specific point in time.
    addEventListener('keydown', event => {
      switch (event.code) {
        case 'ArrowLeft': rate = -1; break;
        case 'ArrowRight': rate = 1; break;
        default: return;
      }
      updateTimer();
    });
    addEventListener('keyup', event => {
      switch (event.code) {
        case 'ArrowLeft':
        case 'ArrowRight':
          rate = 0;
          break;
        default: return;
      }
      updateTimer();
    });
    // Also allow starting and stopping time by clicking.
    canvas.addEventListener('mousedown', event => {
      rate = rate ? 0 : 1;
      updateTimer();
    });
  })();
</script>

You can stop or start the simulation by clicking, and can control the flow of
time with left and right arrow keys.

The simulation has two shapes being tested for intersections. Below them is
a visualisation of the outputs from GJK and EPA:

  * The output from GJK is shown in cyan.
  * The output from EPA is shown in yellow.

I don't minify the code for my site, so you can simply view the source for this
page to see the commented code.

[axis]: https://en.wikipedia.org/w/index.php?title=Separating_axis_theorem
[minkowski]: https://en.wikipedia.org/wiki/Minkowski_addition
[^convex]: Convexity is a prerequisite for a lot of efficient collision
    algorithms and we can handle many concave shapes by decomposing them into
    convex components.
