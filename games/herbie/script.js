const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
const herbie = new Image;
herbie.src = 'herbie.png';

function resize() {
  const w = devicePixelRatio * innerWidth, h = devicePixelRatio * innerHeight;
  canvas.width = w;
  canvas.height = h;
  context.imageSmoothingEnabled = false;
}

resize();
addEventListener('resize', resize);

const SPEED = 10;
let input = 0;
let frame = 0;
let chew = 0;

addEventListener('keydown', event => {
  switch (event.code) {
    case 'KeyA':
      input = -1;
      break;
    case 'KeyD':
      input = 1;
      break;
    case 'Space':
      chew = 8;
      animState = 0;
      break;
  }
});

addEventListener('keyup', event => {
  switch (event.code) {
    case 'KeyA':
    case 'KeyD':
      input = 0;
      break;
  }
});

const WIDTH = 256, HEIGHT = 128;
addEventListener('mousedown', event => {
  const scale = Math.min(innerWidth / WIDTH, innerHeight / HEIGHT);
  const x = (event.x - innerWidth * 0.5) / scale + 0.5 * WIDTH;
  const y = (event.y - innerHeight * 0.5) / scale + 0.5 * HEIGHT;
  console.log(`${x}, ${y}`);
  treats.push({x, y, dy: 0});
  console.log(treats[treats.length - 1]);
});

const treats = [];
for (let i = 0; i < 10; i++) {
  treats.push({x: WIDTH * Math.random(), y: HEIGHT - 2, dy: 0});
}

const GRAVITY = 100;
function updateTreats(dt) {
  context.fillStyle = "#553300";
  for (let i = 0, n = treats.length; i < n; i++) {
    const treat = treats[i];
    if (treat.y < HEIGHT - 2) {
      treat.dy += GRAVITY * dt;
      treat.y += treat.dy * dt;
    }
    if (treat.y > HEIGHT - 2) treat.y = HEIGHT - 2;
    context.fillRect(treat.x, treat.y, 1, 1);
  }
}

// animState varies from -2 to 2 for the different directions that Herbie can
// face.
let animState = 2;
let phase = 0;
let x = 128;
let right = true;
function updateDog() {
  // Decide how to move.
  if (treats.length == 0) {
    input = 0;
  } else {
    let nearestTreatIndex = 0;
    let nearestTreatDistance = Infinity;
    for (let i = 0; i < treats.length; i++) {
      const treat = treats[i];
      if (treat.y != HEIGHT - 2) continue;  // Skip treats which are in the air.
      const distance = Math.abs(treat.x - x);
      if (distance < nearestTreatDistance) {
        nearestTreatDistance = distance;
        nearestTreatIndex = i;
      }
    }
    const faceX = right ? x + 14 : x - 14;
    const nearestTreat = treats[nearestTreatIndex];
    if (nearestTreatDistance < 16) {
      chew = 8;
      animState = 0;
      treats.splice(nearestTreatIndex, 1);
    } else {
      input = Math.sign(nearestTreat.x - faceX);
    }
  }
  // Animate.
  phase = (phase + 1) % 4;
  if (chew) {
    chew--;
    frame = right ? 16 + phase : 24 + phase;
    return;
  }
  const target = 2 * input;
  const current = animState;
  animState = current + Math.sign(target - current);
  switch (animState) {
    case 2:
      frame = phase;
      break;
    case 1:
      right = true;
      frame = 4;
      break;
    case 0:
      if (input == 0) {
        frame = right ? 32 + phase : 40 + phase;
      } else {
        frame = 5;
      }
      break;
    case -1:
      right = false;
      frame = 12;
      break;
    case -2:
      frame = 8 + (3 - phase);
      break;
  }
  x += 3 * animState;
}

function tick(dt) {
  // Clear the canvas and prepare the transform.
  const w = canvas.width, h = canvas.height;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, w, h);
  context.translate(0.5 * w, 0.5 * h);
  const s = Math.min(w / WIDTH, h / HEIGHT);
  context.scale(s, s);
  context.translate(-0.5 * WIDTH, -0.5 * HEIGHT);
  // Draw.
  const fx = frame % 8, fy = Math.floor(frame / 8);
  context.drawImage(
      herbie, 32 * fx, 32 * fy, 32, 32, x - 16, HEIGHT - 32, 32, 32);
  updateTreats(dt);
}

setInterval(updateDog, 60);
setInterval(() => tick(1 / 60), 1000 / 60);
