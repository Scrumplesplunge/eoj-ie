// Dimensions of the rocket.
export const ROCKET_WIDTH = 10;     // Diameter of the rocket, in metres.
export const ROCKET_HEIGHT = 50;    // Height of the rocket, in metres.

// The mass of the rocket, excluding the mass of any fuel it is carrying.
export const ROCKET_MASS =
    2000 * Math.PI * ROCKET_WIDTH ** 2 * ROCKET_HEIGHT / 4;

// The initial amount of fuel, of each type, in kg.
export const FUEL = 10000000;
export const RCS_FUEL = 10000;

// The maximum thrust of the rocket thrusters, in kgm/s^2.
export const ROCKET_THRUST = 2e9;
export const RCS_THRUST = 2e6;

// The maximum angle of the main thruster, relative to the rocket's orientation.
export const MAX_ROCKET_THRUSTER_ANGLE = 1;

// Given the target:
//
//   Orbit time:     2 minutes
//   Orbit speed: 1000 m/s
//
// We can derive:
//
//   Orbit circumference = 1000 m/s * 2 minutes = 120 km
//   Orbit radius = 120km / (2 * PI) ~= 19km
//   Gravity = (1000 m/s)^2 * (120km / (2 * PI)) ~= 19 Mm^3/s^2
//
// Thus, PLANET_RADIUS + ATMOSPHERE_SIZE should be just under 19km.
export const GRAVITY = 1e3 ** 2 * 120e3 / (2 * Math.PI);
export const PLANET_RADIUS = 15000;  // Radius of the planet, in metres.
export const ATMOSPHERE_SIZE = 4000;  // Height of the atmosphere, in metres.

// The speed of radio transmissions, in metres per second.
export const TRANSMISSION_SPEED = 30000;

// How long it takes for the planet to do a full rotation.
export const PLANET_DAY = 3600;

// The amount of time between consecutive simulation ticks, in seconds.
export const DELTA_TIME = 1/128;

// The amount of time between consecutive sensor samples, in seconds.
export const SENSOR_TIME = 1/16;
