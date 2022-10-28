export interface Vector {
  x: number;
  y: number;
}

// The Reaction Control System has four thrusters which each expose the same
// interface, so this interface avoids some duplication.
export interface Rcs<T> {
  topLeft: T;
  topRight: T;
  bottomLeft: T;
  bottomRight: T;
}

export interface SatellitePing {
  // The numerical ID of the beacon which this ping is from.
  id: number;

  // The position of the satellite when the transmission was made.
  origin: Vector;

  // The time when this transmission was made.
  sendTime: number;

  // The time at which this transmission was received.
  receiveTime: number;
}

export interface ThrusterInfo {
  // The current angle of the thruster, in radians, relative to the rocket's
  // orientation.
  angle: number;

  // The current thrust amount of the thruster, in the range [0, 1], where:
  //   0 means the thruster is powered down.
  //   1 means the thruster is operating at maximum thrust.
  thrust: number;
}

export interface Tick {
  // The current simulation time.
  time: number;

  // The current simulation speed, in seconds per second. This is always an
  // integer. This can be ignored unless you are running your own timers and
  // need to keep them in sync with the simulation.
  simulationSpeed: number;

  // The current angle of the planet, relative to its initial orientation.
  planetAngle: number;
}

export interface Intent {
  // Whether the rocket's landing gear should be down or not.
  landingGearDown: boolean;

  // What angle the main thruster should be pointing, relative to the rocket's
  // orientation.
  thrusterAngle: number;

  // What thrust level the rocket's main thruster should be at, in the range
  // [0, 1], with 1 meaning maximum thrust.
  thrust: number;

  // What angle the body flaps should be at, in the range [-1, 1], where:
  //   0 means the flaps are extended straight out.
  //  -1 means the flaps are tilted to the left (if the rocket is pointing
  //     upwards), producing minimum lift when the rocket is moving left to
  //     right through the atmosphere.
  //   1 means the flaps are tilted to the right (if the rocket is pointing
  //     upwards), producing minimum lift when the rocket is moving right to
  //     left through the atmosphere.
  topFlapAngle: number;
  bottomFlapAngle: number;

  // What thrust level the rocket's reaction control system (RCS) thrusters
  // should be at, in the range [0, 1], with 1 meaning maximum thrust. These
  // thrusters only provide a small amount of thrust and can be used to make
  // minor adjustments to the rocket's orientation in space.
  rcsThrust: Rcs<number>;
}

export interface Prediction {
  // Where the flight controller thinks the rocket is.
  position: Vector;
  angle: number;
}

export interface RocketLocation {
  // The current position and velocity of the rocket.
  position: Vector;
  velocity: Vector;
  angle: number;
  angularVelocity: number;
}

export interface RocketSensors {
  // The current orientation of the rocket, relative to its initial orientation.
  gyro: number;

  // The current acceleration of the rocket, relative to its own orientation.
  acceleration: Vector;

  // The current status of the rocket's main thruster.
  thruster: ThrusterInfo;

  // The current state of the landing gear, in the range [0, 1], where:
  //   0 means the landing gear is fully raised.
  //   1 means the landing gear is fully lowered.
  landingGear: number;

  // The current angle of the body flaps, in the range [-1, 1], where:
  //   0 means the flaps are extended straight out.
  //  -1 means the flaps are tilted to the left (if the rocket is pointing
  //     upwards), producing minimum lift when the rocket is moving left to
  //     right through the atmosphere.
  //   1 means the flaps are tilted to the right (if the rocket is pointing
  //     upwards), producing minimum lift when the rocket is moving right to
  //     left through the atmosphere.
  topFlapAngle: number;
  bottomFlapAngle: number;

  // The current amount of fuel, as a fraction of the maximum capacity.
  fuel: number;
  rcsFuel: number;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface Configuration {
  // The difficulty level that the user will attempt.
  difficulty: Difficulty;

  // The amount of fuel to load in the rocket, as a fraction of the maximum.
  fuel: number;
  rcsFuel: number;
}

// The interface for messages sent by the user. Any combination of fields can be
// set on any message.
export declare interface UserMessage {
  configuration?: Configuration;

  // Instructions for the rocket. The rocket will continue to use the most
  // recent instruction it received until it receives a new one.
  intent?: Intent;

  // A prediction of where the rocket is right now. This is for debugging
  // purposes only: it is rendered as a purple outline to aid in developing
  // accurate location prediction.
  prediction?: Prediction;
}

export interface GameMessage {
  // Sent with a period of DELTA_TIME, as measured in simulation time. When the
  // simulation is running faster than realtime, ticks will happen more
  // frequently, as measured by wall time, but at the same rate as measured in
  // simulation time.
  tick?: Tick;

  // Only sent for "easy". Sent with a period of SENSOR_TIME.
  location?: RocketLocation;

  // Sent with a period of SENSOR_TIME.
  sensors?: RocketSensors;

  // Sent when the rocket receives a transmission from one of the satellites
  // orbiting the planet. Using the send and receive times, along with
  // TRANSMISSION_SPEED, the approximate distance to the satellite can be
  // calculated. Combining multiple pings, the precise location of the rocket
  // can be determined.
  satellitePing?: SatellitePing;
}
