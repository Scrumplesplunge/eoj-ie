var builderState = new EventManager("builder");
var horizon;
var levelImage;

var focus = new Vector(0, 0);  // Camera centre.
var cameraMovement = new Vector(0, 0);  // Movement speed of the camera.
var targetPosition = new Vector(0, 0);  // Mouse position in world coordinates.

var levelData = {
  imageName: "",
  shapes: [],
  points: {},
};

// Shape currently under construction. If no shape is under construction, this
// is null. If there is a shape under construction, it is an array of the
// confirmed boundaries.
var currentShape = [];

function loadLevelImage(name) {
  console.log("Loading level image " + name + "...");
  levelData.imageName = name;
  levelImage = loadImage(name, function() {
    console.log("Level image loaded.");
    focus = new Vector(levelImage.width * 0.5, levelImage.height * 0.5);
    updateData();
  });
}

function updateData() {
  data.value = JSON.stringify(levelData, null, 2);
}

Game.startState.on("enter", function(event) {
  // Force showBoundaries so that we can see what we are doing.
  Config.showBoundaries = true;

  image.addEventListener("change", function() {
    loadLevelImage("images/" + image.files[0].name);
  });

  var barrier = new AsyncBarrier;
  Sprites.load(barrier.increment());
  horizon = loadImage("images/red_horizon.png", barrier.increment());
  barrier.wait(() => Game.switchState(builderState));
});

builderState.on("update", function(event) {
  var movementDelta = Config.levelMakerCameraSpeed * event.delta;
  focus = focus.add(cameraMovement.mul(movementDelta));
});

builderState.on("mousemove", function(event) {
  var center = new Vector(
      Config.screen.width * 0.5, Config.screen.height * 0.5);
  targetPosition = focus.sub(center).add(new Vector(event.x, event.y));
});

builderState.on("mousedown", function(event) {
  switch (event.button) {
    case 0:  // Left mouse button adds boundary points.
      console.log("Adding point [%f, %f]", targetPosition.x, targetPosition.y);
      currentShape.push([targetPosition.x, targetPosition.y]);
      break;
    case 1:  // Middle mouse button.
      if (currentShape.length == 0) {
        // When not building a shape, middle mouse button does nothing.
      } else {
        // When building a shape, middle mouse button closes it.
        console.log("Closing shape.");
        currentShape.push(currentShape[0]);
        levelData.shapes.push(currentShape);
        currentShape = [];
        updateData();
      }
      break;
    case 2:  // Right mouse button.
      if (currentShape.length == 0) {
        // When not building a shape, right mouse button tags a point.
        var position = [targetPosition.x, targetPosition.y];
        // Chrome has a bug where prompt/confirm causes the whole browser to
        // hang. I think we will have to do without :(
        //
        // var label = prompt("Enter a label for this point.");
        // if (!levelData.labels.hasOwnProperty(label) ||
        //     confirm("There is already a point with the label " + label +
        //             ". Replace?")) {
        //   levelData.labels[label] = position;
        // }
      } else {
        // When building a shape, right mouse button discards the temporary
        // boundary and finishes.
        console.log("Discarding temporary boundary and finishing shape.");
        levelData.shapes.push(currentShape);
        currentShape = [];
        updateData();
      }
      break;
  }
});

var keyboard = new Keyboard(builderState);
keyboard.on("keydown", function(event) {
  switch (event.key) {
    case "ArrowLeft": cameraMovement.x -= 1; break;
    case "ArrowRight": cameraMovement.x += 1; break;
    case "ArrowUp": cameraMovement.y -= 1; break;
    case "ArrowDown": cameraMovement.y += 1; break;
  }
});

keyboard.on("keyup", function(event) {
  switch (event.key) {
    case "ArrowLeft": cameraMovement.x += 1; break;
    case "ArrowRight": cameraMovement.x -= 1; break;
    case "ArrowUp": cameraMovement.y += 1; break;
    case "ArrowDown": cameraMovement.y -= 1; break;
  }
});

builderState.on("draw", function(event) {
  var canvas = event.context.canvas;
  event.context.drawImage(horizon, 0, 0);
  event.context.save();
    var center = new Vector(canvas.width * 0.5, canvas.height * 0.5);
    var offset = center.sub(focus);
    event.context.translate(offset.x, offset.y);
    if (levelImage) event.context.drawImage(levelImage, 0, 0);
    // Draw all pre-defined boundaries.
    for (var i = 0, n = levelData.shapes.length; i < n; i++) {
      var shape = levelData.shapes[i];
      for (var j = 1, m = shape.length; j < m; j++) {
        var a = new Vector(shape[j - 1][0], shape[j - 1][1]);
        var b = new Vector(shape[j][0], shape[j][1]);
        var boundary = new Boundary(a, b);
        boundary.draw(event.context);
      }
    }
    // Draw the temporary boundary.
    if (currentShape.length > 0) {
      event.context.strokeStyle = "#0000ff";
      for (var i = 1, n = currentShape.length; i < n; i++) {
        var a = new Vector(currentShape[i - 1][0], currentShape[i - 1][1]);
        var b = new Vector(currentShape[i][0], currentShape[i][1]);
        var boundary = new Boundary(a, b);
        boundary.draw(event.context);
      }
      event.context.strokeStyle = "#ff0000";
      var last = currentShape[currentShape.length - 1];
      var a = new Vector(last[0], last[1]);
      var b = targetPosition;
      var boundary = new Boundary(a, b);
      boundary.draw(event.context);
    }
  event.context.restore();
});
