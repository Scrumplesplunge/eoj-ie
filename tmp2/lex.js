const TokenType = {
  INT: /^(0|[1-9][0-9]*)/,
  FLOAT: /^(0|[1-9][0-9]*)\.[0-9]+/,
  STRING: /^"([^\"\n]|\\.)*"/,
  NAME: /^[a-zA-Z_][a-zA-Z0-9_]*/,
  BRACKET: /^[(){}\[\]]/,
  SEMICOLON: /^;/,
  SYMBOL: /^[+\-*/=<>!,.&|]+/,
};

class Location {
  constructor(source, line, column, offset) {
    this.source = source;
    this.line = line;
    this.column = column;
    this.offset = offset;
  }
  toJSON() { return this.line + ":" + this.column }
  clone() {
    return new Location(this.source, this.line, this.column, this.offset);
  }
  advance(n) {
    if (this.offset + n > this.source.length) {
      throw new Error("Advanced beyond the end of the source.");
    }
    for (let i = this.offset, end = i + n; i < end; i++) {
      if (this.source[i] == "\n") {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
    }
    this.offset += n;
  }
  formatMessage(message) {
    const lineStart = this.offset - (this.column - 1);
    let lineEnd = this.source.indexOf("\n", this.offset);
    if (lineEnd == -1) lineEnd = this.source.length;
    const lineContents = this.source.substring(lineStart, lineEnd);
    return this.line + ":" + this.column + ": " + message + "\n\n" +
           "    " + lineContents + "\n" +
           " ".repeat(4 + this.column - 1) + "^";
  }
}

function* lex(source) {
  let location = new Location(source, 1, 1, 0);
  let remaining = source;
  function error(message) {
    return new Error(location.formatMessage("error: " + message));
  }
  function advance(n) {
    location.advance(n);
    remaining = remaining.substr(n);
  }
  while (true) {
    // Skip whitespace and comments.
    let [whitespace] = remaining.match(/\s*(\/\/[^\n]+\s*)*/);
    advance(whitespace.length);
    if (remaining.length == 0) {
      yield {location, type: "EOF", value: ""};
      return;
    }
    // Extract a token.
    let best = "ILLEGAL", match = "";
    for (let i in TokenType) if (TokenType.hasOwnProperty(i)) {
      let temp = remaining.match(TokenType[i]);
      if (temp && temp[0].length > match.length) {
        best = i;
        match = temp[0];
      }
    }
    if (best == "ILLEGAL") {
      throw error("illegal token");
    }
    yield {location: location.clone(), type: best, value: match};
    advance(match.length);
  }
}
