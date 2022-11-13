[Space Race](/games/space-race) is a small coding game. The objective is to
implement a flight controller program which will allow a rocket to take off,
orbit a planet, and then land again on the launchpad.

## Getting Started

To play the game, you will need to create a `solution.js` file containing
a flight controller program, and then host it on a web server. By default, the
simulator will attempt to load the solution from `localhost:8000/solution.js`.
One quick way to get up and running is to use `python3 -m http.server` to serve
your solution.

If you want to load a solution from a different location, you can override the
loading path by setting `localStorage.path` via the developer tools in your
browser. For example, try pointing it at the [template
solution](/games/space-race/solution.js) to begin with.

## User Interface

  * Scrolling the mouse wheel will zoom the camera in or out.
  * `<` and `>` control time warp, like in Kerbal Space Program.
  * `?` toggles the debug overlay, which will show you some of the important
    effects which are normally not visible, such as satellite pings or air
    resistance.

## API

To control the rocket, you will need to tell it what to do. The game will give
you information about your rocket so that you can decide what to do. All
communication between your flight controller and the game happens
asynchronously: the rocket will not pause while you calculate a strategy, it
will keep flying, so you need to act fast!

Communication in both directions is via the [`postMessage()`][postMessage] API.
There are various kinds of message that can be sent or received. The full
interface is described in [`api.ts`](/games/space-race/api.ts). In addition to
the raw API, there are some convenience definitions available for the flight
controller to use: see [`constants.ts`](/games/space-race/constants.ts) and
[`math.ts`](/games/space-race/math.ts).

[postMessage]: https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage:

## Scoring?

There are multiple criteria by which you can grade your flight controller:

  * How quick was it?
  * How much fuel did it use?
  * How smooth does the flight look?
