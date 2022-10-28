postMessage({
  configuration: {
    difficulty: "easy",
    fuel: 0,
    rcsFuel: 0,
  },
});

let position = new Vector(0, 0);
let velocity = new Vector(0, 0);
let angle = 0;
let angularVelocity = 0;

addEventListener('message', event => {
  if (event.data.location !== undefined) {
    // Record the location of the rocket.
    const l = event.data.location;
    position = new Vector(l.position.x, l.position.y);
    velocity = new Vector(l.velocity.x, l.velocity.y);
    angle = l.angle;
    angularVelocity = l.angularVelocity;
    // Big brain: predict the location of the rocket exactly as it is.
    postMessage({prediction: {position, angle}});
  }
  if (event.data.tick !== undefined && location !== null) {
    // Plan some flight path.
    const altitude = position.len() - PLANET_RADIUS;
    const isFlyingHigh = altitude > 100;
    const surfaceAngle = Math.atan2(position.y, position.x);
    const intent = {
      thrust: 0.5,
      thrusterAngle: 0,
      landingGearDown: !isFlyingHigh,
      topFlapAngle: 0,
      bottomFlapAngle: 0,
      rcsThrust: {
        topLeft: 0,
        topRight: 0,
        bottomLeft: 0,
        bottomRight: 0,
      },
    };
    postMessage({intent});
  }
});
