var colorPicker = new EventManager("color picker");
var deathState = new EventManager("death");
var successState = new EventManager("success");
var pauseState = new EventManager("pause");
var endState = new EventManager("end");
var wizard;
var level;
var portal;
var horizon;

// This is the sequence of levels that occur after the tutorial level.
var currentLevelData = Levels.tutorial;
var levelSequence = [
  Levels.level1,
];

function drawStatus(event) {
  with (event.context) {
    save();
      // Write the level name at the top.
      font = "20pt sans-serif";
      textBaseline = "top";
      fillStyle = "#000000";
      fillText("Level: " + level.name, 10, 10);

      if (!wizard.removed) {
        // Render the life bar.
        var fraction = wizard.life / Config.creatures.wizard.maxLife;
        var maxWidth = Config.screen.width - 20;
        fillStyle = "#ff0000";
        fillRect(10, Config.screen.height - 30, fraction * maxWidth, 20);
        if (wizard.selectedItem < wizard.items.length) {
          Sprites.sheet.items.draw(
              event.context, Sprites.codes.items.selection,
              10 + 64 * wizard.selectedItem, Config.screen.height - 99, 64, 64);
        }
        for (var i = 0, n = wizard.items.length; i < n; i++) {
          Sprites.sheet.items.draw(event.context, wizard.items[i].sprite,
                                   10 + 64 * i, Config.screen.height - 99,
                                   64, 64);
        }
      }
    restore();
  }
}

function configureLevel(level) {
  level.keyboard.on("keydown", function(event) {
    if (event.key == "Escape") Game.switchState(pauseState);
  });
  level.on("draw", drawStatus);
}

function loadLevel(levelData, loader) {
  var pointHandlers = {
    "player": function(level, position, callback) {
      console.log("Spawning player at [%f, %f].", position.x, position.y);
      wizard = new Wizard(position);
      wizard.on("death", function(event) {
        level.randomParticles(wizard.position, 30, 50, 200, 0.5);
        Game.switchState(deathState);
      });
      level.keyboard.on("keydown", function(event) {
        switch (event.key) {
          case "a": wizard.movement -= 1; break;
          case "d": wizard.movement += 1; break;
          case "w": wizard.jump(); break;
        }
        if (event.key.length == 1 && "0" <= event.key && event.key <= "9")
          wizard.trySelectItem(event.key - 1);
      });
      level.keyboard.on("keyup", function(event) {
        switch (event.key) {
          case "a": wizard.movement += 1; break;
          case "d": wizard.movement -= 1; break;
        }
      });
      level.on("mousedown", function(event) {
        wizard.tryCast(level.mousePosition);
      });
      level.add(wizard);
      level.target = wizard;
      level.cameraPosition = position;
      schedule(callback);
    },
    "monster": function(level, position, callback) {
      level.add(new Monster(position, null));
      schedule(callback);
    },
    "monsterSpawner": function(level, position, callback) {
      level.add(new MonsterSpawner(position, 200, 10));
      schedule(callback);
    },
    "health": function(level, position, callback) {
      level.add(new Health(position, 50));
      schedule(callback);
    },
    "transformSpell": function(level, position, callback) {
      level.add(new TransformSpell(position));
      schedule(callback);
    },
    "portalActivateSpell": function(level, position, callback) {
      level.add(new PortalActivateSpell(position));
      schedule(callback);
    },
    "portal": function(level, position, callback) {
      portal = new Portal(position, successState);
      level.add(portal);
      schedule(callback);
    },
    "inactivePortal": function(level, position, callback) {
      portal = new InactivePortal(position, successState);
      level.add(portal);
      schedule(callback);
    },
  };
  var level = new Level(levelData, pointHandlers, loader.loaded("level"));
  configureLevel(level);
  return level;
}

Game.startState.on("enter", function(event) {
  var loader = new Loader("loader");
  Sprites.load(loader.loaded("sprites"));
  horizon = loader.loadImage("images/blue_horizon.png");
  loader.waitUntilLoaded(() => Game.switchState(colorPicker));
  Game.switchState(loader);
});

class Picker {
  constructor(name, x, y, options) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.options = [];
    var optionsWidth = Config.screen.width * 0.5;
    var boxWidth = optionsWidth / options.length;
    for (var i = 0, n = options.length; i < n; i++) {
      var minX = x + i * boxWidth - 0.5 * optionsWidth;
      var minY = y + 5;
      this.options.push({
        minX: minX,
        minY: minY,
        maxX: minX + boxWidth,
        maxY: minY + 30,
        color: options[i],
      });
    }
  }
  boxAtPoint(x, y) {
    for (var i = 0, n = this.options.length; i < n; i++) {
      var box = this.options[i];
      if (box.minX < x && x < box.maxX && box.minY < y && y < box.maxY)
        return box;
    }
    return null;
  }
  draw(context) {
    context.save();
      context.fillStyle = "#000000";
      context.textAlign = "center";
      context.font = "20pt sans-serif";
      context.fillText(this.name + ":", this.x, this.y - 5);
      this.options.forEach(box => {
        context.fillStyle = box.color;
        context.fillRect(box.minX + 2, box.minY + 2,
                 box.maxX - box.minX - 4, box.maxY - box.minY - 4);
      });
    context.restore();
  }
}

var robePicker = new Picker(
    "Robe", Config.screen.width * 0.5, Config.screen.height * 0.45,
    ["#000000", "#5c5c5c", "#8a00ff", "#008800"]);
var skinPicker = new Picker(
    "Skin", Config.screen.width * 0.5, Config.screen.height * 0.6,
    ["#acacac", "#87b144", "#cfd086", "#41351d"]);
var shoesPicker = new Picker(
    "Shoes", Config.screen.width * 0.5, Config.screen.height * 0.75,
    ["#1c1c1c", "#5c5c5c", "#41351d", "#ffffff"]);

colorPicker.on("draw", function(event) {
  with (event.context) {
    save();
      drawImage(horizon, 0, 0);
      fillStyle = "#000000";
      textAlign = "center";
      font = "50pt sans-serif";
      fillText("Pick your wizard:", canvas.width * 0.5, canvas.height * 0.2);
      font = "30pt sans-serif";
      fillText("Hit ENTER to begin.", canvas.width * 0.5, canvas.height * 0.95);

      // Draw the current wizard style.
      var codes = Sprites.codes.creatures.wizard;
      var sprite = codes.direction.right + codes.state.stationary;
      [codes.part.shoes, codes.part.skin, codes.part.robe].forEach(part => {
        Sprites.sheet.wizard.draw(
            event.context, sprite + part,
            canvas.width * 0.5 - 32, canvas.height * 0.3 - 32, 64, 64);
      });

      // Draw the color pickers.
      robePicker.draw(event.context);
      skinPicker.draw(event.context);
      shoesPicker.draw(event.context);
    restore();
  }
});

var mouse = new Vector(0, 0);
colorPicker.on("mousemove", event => mouse = new Vector(event.x, event.y));

colorPicker.on("mousedown", function(event) {
  var config = Config.creatures.wizard.color;

  var box = robePicker.boxAtPoint(mouse.x, mouse.y);
  if (box != null) config.robe = box.color;

  var box = skinPicker.boxAtPoint(mouse.x, mouse.y);
  if (box != null) config.skin = box.color;

  var box = shoesPicker.boxAtPoint(mouse.x, mouse.y);
  if (box != null) config.shoes = box.color;

  Sprites.sheet.wizard.setColors(
      config.bones, config.robe, config.shoes, config.skin);
});

colorPicker.on("keydown", function(event) {
  if (event.key == "Enter") {
    var loader = new Loader("loader");
    level = loadLevel(currentLevelData, loader);
    loader.waitUntilLoaded(() => Game.switchState(level));
    Game.switchState(loader);
  }
});

function drawOverlay(context, color, title, subtitle) {
  with (context) {
    save();
      globalAlpha = 0.5;
      fillStyle = "#000000";
      fillRect(0, 0, canvas.width, canvas.height);
      globalAlpha = 1;
      fillStyle = color;
      textAlign = "center";
      font = "50pt sans-serif";
      textBaseline = "bottom";
      fillText(title, canvas.width * 0.5, canvas.height * 0.5 - 10);
      font = "20pt sans-serif";
      textBaseline = "top";
      fillText(subtitle, canvas.width * 0.5, canvas.height * 0.5 + 10);
    restore();
  }
}

var deathStateTimeout = 0;
deathState.on("enter", function(event) {
  level.trigger(event);
  deathStateTimeout = Config.deathScreenTimeout;
});

deathState.on("update", function(event) {
  level.trigger(event);
  deathStateTimeout -= event.delta;
  if (deathStateTimeout < 0) {
    var loader = new Loader("loader");
    level = loadLevel(currentLevelData, loader);
    loader.waitUntilLoaded(() => Game.switchState(level));
    Game.switchState(loader);
  }
});

deathState.on("draw", function(event) {
  level.trigger(event);
  drawOverlay(event.context, "#ff0000", "You died",
              "Respawning in " + deathStateTimeout.toFixed(1) + " seconds...");
});

var successStateTimeout = 0;
successState.on("enter", function(event) {
  if (levelSequence.length == 0) Game.switchState(endState);
  successStateTimeout = Config.successScreenTimeout;
});

successState.on("update", function(event) {
  level.trigger(event);
  successStateTimeout -= event.delta;
  if (successStateTimeout < 0) {
    currentLevelData = levelSequence.shift();
    var loader = new Loader("loader");
    level = loadLevel(currentLevelData, loader);
    loader.waitUntilLoaded(() => Game.switchState(level));
    Game.switchState(loader);
  }
});

successState.on("draw", function(event) {
  level.trigger(event);
  drawOverlay(event.context, "#00ff00", "Success!",
              "Continuing in " + successStateTimeout.toFixed(1) +
              " seconds...");
});

var previousState;  // Stores the state that we paused from.
pauseState.on("enter", function(event) {
  previousState = event.from;
});

pauseState.on("keydown", function(event) {
  if (event.key == "Escape") Game.switchState(previousState);
});

pauseState.on("draw", function(event) {
  level.trigger(event);
  drawOverlay(event.context, "#ffffff", "Paused", "Press ESC to resume.");
});

endState.on("update", function(event) {
  level.trigger(event);
});

endState.on("draw", function(event) {
  level.trigger(event);
  drawOverlay(event.context, "#00ff00", "Game Complete!",
              "Thanks for playing!");
});
