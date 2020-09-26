var canvas = document.getElementById('screen');
var context = canvas.getContext('2d');

var dictionary = [
  'agree', 'amino', 'await', 'banes', 'beard', 'bendy', 'brass', 'buyer',
  'clans', 'clops', 'cohos', 'daily', 'diced', 'drupe', 'fakes', 'fires',
  'flour', 'frill', 'frogs', 'gimpy', 'gnaws', 'grits', 'grubs', 'haven',
  'hubby', 'manic', 'menus', 'miffs', 'moths', 'mouth', 'olden', 'papaw',
  'prime', 'puppy', 'rapid', 'rebel', 'remix', 'sages', 'shirt', 'skied',
  'spars', 'speck', 'spell', 'stets', 'sumps', 'synth', 'tints', 'untie',
  'unzip', 'yearn',
];

var colors = [
  '#C00', '#0C0', '#00C', '#C80',
  '#0CC', '#CC0', '#C0C', '#80C',
];

var GRID_SIZE = 5;  // Must be odd to ensure that all but one word is repeated.

// List of players. Grows up to colors.length in size.
var players = [];

// GRID_SIZE * GRID_SIZE entries.
var grid = [];

// Value of the target cell.
var target = '';

// Time when the round started (derived from Date.now()).
var roundStart = 0;

// If true, the game is active. If false, we are between rounds and the outcome
// of the previous game should be displayed.
var roundActive = false;

// Used when roundActive is false to show the outcome of the last game.
// actingPlayer is the index of the player which performed the round-ending
// action and chosen is the value of the cell which was selected.
var actingPlayer = 0;
var chosen = '';

// Timer for the game tick.
var updateLoop = 0;

function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
}
resize();
addEventListener('resize', resize);

class Button {
  constructor() {
    this.isPressed = false;
    this.handlers = []
  }
  subscribe(callback) { this.handlers.push(callback) }
  update(isPressed) {
    if (!this.isPressed && isPressed) {
      for (var h of this.handlers) h();
    }
    this.isPressed = isPressed;
  }
}

class Controller {
  constructor(id) {
    this.id = id;
    this.up = new Button;
    this.down = new Button;
    this.left = new Button;
    this.right = new Button;
    this.activate = new Button;
  }
  update(gamepad) { throw new Error('Unimplemented.') }
}

class StandardController extends Controller {
  constructor(id) {
    super(id);
  }
  update(gamepad) {
    this.left.update(gamepad.axes[0] < -0.75);
    this.right.update(gamepad.axes[0] > 0.75);
    this.up.update(gamepad.axes[1] < -0.75);
    this.down.update(gamepad.axes[1] > 0.75);
    this.activate.update(gamepad.buttons[0].pressed);
  }
}

class SteamController extends Controller {
  constructor(id) {
    super(id);
  }
  update(gamepad) {
    this.left.update(gamepad.axes[0] < -0.75);
    this.right.update(gamepad.axes[0] > 0.75);
    this.up.update(gamepad.axes[1] < -0.75);
    this.down.update(gamepad.axes[1] > 0.75);
    this.activate.update(gamepad.buttons[2].pressed);
  }
}

function controller(id) {
  var gamepad = navigator.getGamepads()[id];
  if (gamepad.mapping == "standard") return new StandardController(id);
  switch (gamepad.id) {
    case '28de-1142-Wireless Steam Controller':
    case 'Valve Software Steam Controller (Vendor: 28de Product: 1142)':
      return new SteamController(id);
    default:
      throw new Error('Unrecognised controller type: ' + gamepad.id);
  }
}

class Player {
  constructor(id) {
    this.id = id;
    this.controller = controller(id);
    this.active = true;
    this.wins = 0;
    this.mistakes = 0;
    this.points = 0;
    this.x = this.y = Math.floor(GRID_SIZE / 2);
    this.controller.up.subscribe(() => this.y = Math.max(0, this.y - 1));
    this.controller.down.subscribe(
        () => this.y = Math.min(GRID_SIZE - 1, this.y + 1));
    this.controller.left.subscribe(() => this.x = Math.max(0, this.x - 1));
    this.controller.right.subscribe(
        () => this.x = Math.min(GRID_SIZE - 1, this.x + 1));
    this.controller.activate.subscribe(
        () => endRound(id, grid[this.y * GRID_SIZE + this.x]));
  }
  getColor() { return this.active ? colors[this.id] : '#AAA' }
}

addEventListener('gamepadconnected', event => {
  var i = event.gamepad.index;
  if (i >= colors.length) {
    console.log('Ignoring controller with high index.');
    return;
  }
  if (!players[i]) {
    players[i] = new Player(i);
  }
  players[i].active = true;
});

addEventListener('gamepaddisconnected', event => {
  var i = event.gamepad.index;
  if (players[i]) players[i].active = false;
});

// Perform reservoir sampling to get k random items from the input, each with
// equal probability and no duplicates.
function sample(items, k) {
  if (k > items.length) throw new Error('Sample size invalid.');
  var result = [];
  for (var i = 0; i < k; i++) result.push(items[i]);
  for (var i = k, n = items.length; i < n; i++) {
    if (Math.random() < k / (i + 1)) {
      result[Math.floor(Math.random() * k)] = items[i];
    }
  }
  return result;
}

// Shuffle an array (in-place).
function shuffle(array) {
  for (var i = array.length; i > 1; i--) {
    var j = Math.floor(Math.random() * i);
    var temp = array[j];
    array[j] = array[i - 1];
    array[i - 1] = temp;
  }
}

function reset() {
  clearInterval(updateLoop);
  var count = Math.ceil(GRID_SIZE * GRID_SIZE / 2);
  var [unique, ...repeated] = sample(dictionary, count);
  grid = [unique, ...repeated, ...repeated];
  shuffle(grid);
  target = unique;
  roundStart = Date.now();
  roundActive = true;
  for (var i = 0, n = players.length; i < n; i++) {
    players[i].x = players[i].y = Math.floor(GRID_SIZE / 2);
  }
  updateLoop = setInterval(() => {
    pollInputs();
    draw();
  }, 20);
}

function endRound(playerIndex, selection) {
  if (!roundActive) return;
  roundActive = false;
  actingPlayer = playerIndex;
  chosen = selection;
  // Max points for a round is 100. This halves every 5 seconds while the round
  // is still active.
  var t = 0.001 * (Date.now() - roundStart);
  var points = Math.ceil(100 * Math.pow(2, -0.2 * t));
  if (chosen == target) {
    players[playerIndex].points += points;
    players[playerIndex].wins++;
  } else {
    players[playerIndex].points =
        Math.max(0, players[playerIndex].points - points);
    players[playerIndex].mistakes++;
  }
  setTimeout(reset, 1000);
}

function pollInputs() {
  var gamepads = navigator.getGamepads();
  for (var i = 0, n = gamepads.length; i < n; i++) {
    if (gamepads[i] == null) continue;
    if (!players[i]) continue;
    players[i].controller.update(gamepads[i]);
  }
}

function cell(x, y) {
  return {
    x: 10 + (x + 0.5) * 480 / GRID_SIZE,
    y: 10 + (y + 0.5) * 480 / GRID_SIZE
  };
}

function drawGrid() {
  context.fillStyle = '#000';
  context.beginPath();
  context.rect(10, 10, 480, 480);
  for (var i = 1; i < GRID_SIZE; i++) {
    var p = 10 + i * 480 / GRID_SIZE;
    context.moveTo(p, 10);
    context.lineTo(p, 490);
    context.moveTo(10, p);
    context.lineTo(490, p);
  }
  context.stroke();
  // Draw the words in the grid.
  context.font = '20pt Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (var y = 0; y < GRID_SIZE; y++) {
    for (var x = 0; x < GRID_SIZE; x++) {
      var c = cell(x, y);
      context.fillText(grid[y * GRID_SIZE + x], c.x, c.y);
    }
  }
}

function outlineRect(x, y, w, h, border) {
  context.fillRect(x, y, w, border);
  context.fillRect(x + w - border, y, border, h);
  context.fillRect(x, y + h - border, w, border);
  context.fillRect(x, y, border, h);
}

function drawCursor(id, x, y) {
  var n = players.length;
  var slice = Math.PI / (1.1 * n);
  var cellSize = 480 / GRID_SIZE;
  var phase = (0.002 * Date.now()) % (2 * Math.PI);
  var a = phase + slice * 1.1 * id, b = Math.PI + a;
  context.beginPath();
  var p = cell(x, y);
  context.moveTo(p.x, p.y);
  context.arc(p.x, p.y, cellSize, a, a + slice);
  context.lineTo(p.x, p.y);
  context.arc(p.x, p.y, cellSize, b, b + slice);
  context.lineTo(p.x, p.y);
  context.save();
  context.clip();
  context.fillStyle = colors[id];
  var delta = 0.5 * cellSize - 2;
  outlineRect(p.x - delta, p.y - delta, 2 * delta, 2 * delta, 5);
  context.restore();
}

function drawCursors() {
  for (var i = 0, n = players.length; i < n; i++) {
    drawCursor(i, players[i].x, players[i].y);
  }
}

function drawScores() {
  var height = 490 / colors.length - 10;
  context.beginPath();
  for (var i = 0, n = colors.length; i < n; i++) {
    context.rect(500, 10 + (height + 10) * i, 240, height);
  }
  context.stroke();
  var byScore = players.slice();
  byScore.sort((a, b) => b.points - a.points);
  for (var i = 0, n = byScore.length; i < n; i++) {
    var x = 500;
    var y = 10 + (height + 10) * i;
    // Display the player stats.
    context.fillStyle = '#000';
    context.textAlign = 'right';
    context.textBaseline = 'alphabetic';
    context.font = 'bold 30pt Arial';
    context.fillText(byScore[i].points.toString().padStart(3, '0'),
                     x + 77, y + 0.75 * height);
    context.font = 'bold 12pt Arial';
    context.fillText(byScore[i].wins.toString().padStart(3, '0'),
                     730, y + 0.45 * height);
    context.fillText(byScore[i].mistakes.toString().padStart(3, '0'),
                     730, y + 0.79 * height);
    context.fillStyle = '#AAA';
    context.font = '10pt Arial';
    context.fillText('wins', 700, y + 0.42 * height);
    context.fillText('mistakes', 700, y + 0.76 * height);
    context.textAlign = 'left';
    context.font = '15pt Arial';
    context.fillText('points', x + 80, y + 0.62 * height);
    context.fillStyle = byScore[i].getColor();
    outlineRect(x + 2, y + 2, 240 - 4, height - 4, 5);
  }
}

function drawOutcome() {
  for (var y = 0; y < GRID_SIZE; y++) {
    for (var x = 0; x < GRID_SIZE; x++) {
      if (grid[y * GRID_SIZE + x] == chosen) {
        drawCursor(actingPlayer, x, y);
      } else {
        var p = cell(x, y);
        var cellSize = 480 / GRID_SIZE;
        var delta = 0.5 * cellSize - 1;
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        context.fillRect(p.x - delta, p.y - delta, 2 * delta, 2 * delta);
      }
    }
  }
}

function draw() {
  // Clear the previous frame.
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  // Transform the canvas so that we can work in a 750x500 area and have it
  // scale appropriately.
  context.translate(0.5 * canvas.width, 0.5 * canvas.height);
  var xScale = canvas.width / 750;
  var yScale = canvas.height / 500;
  var scale = Math.min(xScale, yScale);
  context.scale(scale, scale);
  context.translate(-375, -250);
  drawGrid();
  drawScores();
  if (roundActive) {
    drawCursors();
  } else {
    drawOutcome();
  }
}

reset();
