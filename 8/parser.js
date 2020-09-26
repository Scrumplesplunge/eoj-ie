class Parser {
  constructor(text) {
    this.text = text;
    this.location = new Location(1, 1);
  }

  advance(n) {
    for (var i = 0; i < n; i++)
      this.location.advance(this.text[i]);
    this.text = this.text.substr(n);
  }

  error(message) {
    return new Error("Syntax error at line " + this.location.line +
                     ", column " + this.location.column + ": " + message);
  }

  consume(name, pattern) {
    var result = this.text.match(pattern);
    if (result == null) throw this.error("Expected " + name + ".");
    this.advance(result[0].length);
    return result[0];
  }

  skipWhitespace() {
    var whitespace = this.consume("whitespace", /^(\s+|#[^\n]*)*/);
    return whitespace.length > 0;
  }

  parse() {
    var nodes = [];
    this.skipWhitespace();
    while (this.text.length > 0) {
      nodes.push(this.parseNode());
      this.skipWhitespace();
    }
    return nodes;
  }

  parseNode() {
    this.skipWhitespace();
    if (this.text.length == 0) throw this.error("Unexpected end of input.");
    if (this.text[0] == "(") return this.parseList();
    if (this.text[0] == "\"") return this.parseString();
    if (this.text[0] == "'") return this.parseQuotedNode();
    return this.parseAtom();
  }

  parseList() {
    var location = this.location.copy();
    this.consume("opening parenthesis", /^\(/);
    var list = [];
    while (true) {
      var whitespaceLength = this.skipWhitespace();
      if (this.text.length == 0) throw this.error("Unterminated list.");
      if (this.text[0] == ")") {
        this.consume("closing parenthesis", /^\)/);
        return new Node(Node.LIST, location, list);
      } else if (list.length > 0 && whitespaceLength == 0) {
        // This is not the end of the list, but tokens were not separated.
        throw this.error("Missing whitespace in list.");
      }
      list.push(this.parseNode());
    }
  }

  parseString() {
    var location = this.location.copy();
    var rawString = this.consume("string literal", /^"([^\\"]|\\.)*"/);
    return new Node(Node.STRING, location, JSON.parse(rawString));
  }

  parseQuotedNode() {
    var location = this.location.copy();
    this.consume("quote", /^'/);
    if (this.text.length == 0) throw this.error("Incomplete quote expression.");
    if (this.text.match(/^\s/))
      throw this.error("Illegal whitespace after quote.");
    return new Node(Node.QUOTE, location, this.parseNode());
  }

  parseAtom() {
    var location = this.location.copy();
    var atom = this.consume("atom", /^[^'"()\s]+(?=[)#\s]|$)/);
    if (atom.match(/^(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?(0|[1-9][0-9]*))?$/)) {
      return new Node(Node.NUMBER, location, atom - 0);
    } else {
      return new Node(Node.SYMBOL, location, atom);
    }
  }
}
