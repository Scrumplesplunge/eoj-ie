var textGrid =
    "ABCDEFGH" +
    "IJKLMNOP" +
    "QRSTUVWX" +
    "YZ.,:;!?" +
    "01234567" +
    "89()<|+-";

class Character {
  constructor(font, c) {
    this.font = font;
    this.cell = textGrid.indexOf(c.toUpperCase());
    if (this.cell < 0) throw Error("Character '" + c + "' is unavailable.");
    var gridX = this.cell % 8;
    var gridY = Math.floor(this.cell / 8);
    var cellWidth = font.image.width / 8;
    var cellHeight = font.image.height / 8;
    var cellX = gridX * cellWidth;
    var cellY = gridY * cellHeight;

    // Examine the character and restrict it to the narrowest box that contains
    // it.
    var cell = font.context.getImageData(cellX, cellY, cellWidth, cellHeight);
    var minX = cell.width, maxX = 0;
    for (var y = 0, yLimit = cell.height; y < yLimit; y++) {
      for (var x = 0, xLimit = cell.width; x < xLimit; x++) {
        var alpha = cell.data[4 * (xLimit * y + x) + 3];
        if (alpha == 0) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }

    this.x = cellX + minX;
    this.y = cellY;
    this.width = maxX - minX;
    this.height = cellHeight;
    this.aspect = this.width / this.height;
  }

  draw(ctx) {
    ctx.drawImage(this.font.canvas, this.x, this.y, this.width, this.height,
                  0, 0, this.aspect, 1);
  }
}

class Font {
  constructor(image) {
    this.image = image;

    this.initialized = false;
    this.renderedColors = {};
    this.characters = {};

    this.image.onload = () => this.initialize();

    this.color = "#ffffff";
    this.renderedColor = "";  // The color currently set in the active context.
    this.characterSpacing = 0.1;
    this.spaceWidth = 0.5;
  }

  renderFont() {
    if (this.color == this.renderedColor) return;
    this.renderedColor = this.color;
    if (this.renderedColors.hasOwnProperty(this.color)) {
      // If the color has previously been rendered, there is no need to render
      // it again.
      var r = this.renderedColors[this.color];
      this.canvas = r.canvas;
      this.context = r.context;
      return;
    }

    console.log("Rendering font " + this.image.src + " in color " + this.color);

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.image.width;
    this.canvas.height = this.image.height;
    this.context = this.canvas.getContext("2d");

    this.context.fillStyle = this.color;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.globalCompositeOperation = "destination-in";
    this.context.drawImage(this.image, 0, 0);

    this.renderedColors[this.color] = {
      canvas: this.canvas,
      context: this.context,
    };
  }

  initialize() {
    this.renderFont();
    for (var i = 0, n = textGrid.length; i < n; i++) {
      this.characters[textGrid[i]] = new Character(this, textGrid[i]);
    }

    this.initialized = true;
  }

  widthOf(c) {
    if (!this.initialized) return 1;
    if (c != " " && !this.characters.hasOwnProperty(c))
      throw Error("Character '" + c + "' is unavailable.");
    return c == " " ? this.spaceWidth : this.characters[c].aspect;
  }

  measure(message) {
    message = message.toUpperCase();
    if (message.length == 0) return 0;
    var length = 0;
    for (var i = 0, n = message.length; i < n; i++)
      length += this.widthOf(message[i]) + this.characterSpacing;
    return length;
  }

  draw(ctx, message) {
    message = message.toUpperCase();
    if (!this.initialized) return;
    if (this.renderedColor != this.color) this.renderFont();
    ctx.save();
      for (var i = 0, n = message.length; i < n; i++) {
        if (message[i] == " ") {
          ctx.translate(this.spaceWidth + this.characterSpacing, 0);
          continue;
        }
        var c = message[i];
        if (!this.characters.hasOwnProperty(c))
          throw Error("Character '" + c + "' is unavailable.");
        var character = this.characters[c];
        character.draw(ctx);
        ctx.translate(character.aspect + this.characterSpacing, 0);
      }
    ctx.restore();
  }

  drawAndMeasure(ctx, message) {
    this.draw(ctx, message);
    return this.measure(message);
  }
}
