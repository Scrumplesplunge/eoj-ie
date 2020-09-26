class Location {
  constructor(line, column) {
    this.line = line;
    this.column = column;
  }
  advance(c) {
    if (c == "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
  }
  copy() { return new Location(this.line, this.column); }
}
