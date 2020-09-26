function StringLiteral(value) { this.value = value; }
function CharacterLiteral(value) { this.value = value; }
function Hyphen() {}
function Comma() {}
function OpenSquare() {}
function CloseSquare() {}
function Pipe() {}
function OpenParen() {}
function CloseParen() {}
function Asterisk() {}
function Plus() {}
function QuestionMark() {}
function Dot() {}

class Tokenizer {
  constructor(text) {
    this.text = text;
    this.position = 0;
  }
  static isWhitespace(c) {
    return c == ' ' || c == '\n';
  }
  checkNotEnd(message) {
    if (this.position >= this.text.length) throw new Error(message);
  }
  skipWhitespace() {
    while (this.position < this.text.length &&
           Tokenizer.isWhitespace(this.text[this.position])) {
      this.position++;
    }
  }
  skipWhitespaceAndComments() {
    this.skipWhitespace();
    while (this.text[this.position] == '#') {
      // Skip to the end of the line.
      while (this.position < this.text.length &&
             this.text[this.position] != '\n') {
        this.position++;
      }
      this.skipWhitespace();
    }
  }
  getToken() {
    this.skipWhitespaceAndComments();
    if (this.position == this.text.length) return null;
    let c = this.text[this.position];
    if (c == '"') return this.parseString();
    if (c == "'") return this.parseChar();
    this.position++;
    switch (c) {
      case '-': return new Hyphen;
      case ',': return new Comma;
      case '[': return new OpenSquare;
      case ']': return new CloseSquare;
      case '|': return new Pipe;
      case '(': return new OpenParen;
      case ')': return new CloseParen;
      case '*': return new Asterisk;
      case '+': return new Plus;
      case '?': return new QuestionMark;
      case '.': return new Dot;
      default: throw new Error("Illegal character '" + c + "'.");
    }
  }
  parseDelimitedSequence(type, delimiter) {
    if (this.text[this.position] != delimiter)
      throw new Error("Not a " + type + ".");
    this.position++;
    let value = "";
    while (this.position < this.text.length) {
      if (this.text[this.position] == '\\') {
        // Escaped character.
        this.position++;
        this.checkNotEnd("Unterminated " + type + ".");
        let c = this.text[this.position];
        switch (c) {
          case 'n': value += '\n'; break;
          case 'r': value += '\r'; break;
          case 't': value += '\t'; break;
          default: value += c; break;
        }
        this.position++;
      } else if (this.text[this.position] == delimiter) {
        // End of string.
        this.position++;
        return value;
      } else {
        // Normal character.
        value = value + this.text[this.position];
        this.position++;
      }
    }
    this.checkNotEnd("Unterminated " + type + ".");
  }
  parseString() {
    let value = this.parseDelimitedSequence("string literal", '"');
    return new StringLiteral(value);
  }
  parseChar() {
    let value = this.parseDelimitedSequence("character literal", "'");
    if (value.length != 1) throw new Error("Invalid character literal.");
    return new CharacterLiteral(value);
  }
  *tokens() {
    for (let token = this.getToken(); token != null; token = this.getToken())
      yield token;
  }
}

function CharacterRange(a, b) { this.a = a; this.b = b; }
function Group(expression) { this.expression = expression; }
function Optional(expression) { this.expression = expression; }
function ZeroOrMore(expression) { this.expression = expression; }
function OneOrMore(expression) { this.expression = expression; }
function Sequence(parts) { this.parts = parts; }
function Union(parts) { this.parts = parts; }
class Parser {
  constructor(text) {
    this.tokens = [...(new Tokenizer(text)).tokens()];
    this.position = 0;
  }
  end() { return this.position >= this.tokens.length; }
  peek() {
    if (this.end()) throw new Error("Unexpected end of input.");
    return this.tokens[this.position];
  }
  tryEat(type) {
    if (this.end()) return null;
    let token = this.tokens[this.position];
    if (token.constructor != type) return null;
    this.position++;
    return token;
  }
  eat(type) {
    if (this.end())
      throw new Error("Unexpected end of input: expected " + type.name + ".");
    let token = this.tokens[this.position];
    this.position++;
    if (token.constructor != type) {
      throw new Error("Expected " + type.name + ", got " +
                      token.constructor.name + ".");
    }
    return token;
  }
  parseCharacterLiteralOrRange() {
    let a = this.eat(CharacterLiteral);
    if (this.end() || this.peek().constructor != Hyphen) return a;
    this.eat(Hyphen);
    let b = this.eat(CharacterLiteral);
    return new CharacterRange(a, b);
  }
  parseCharacterSet() {
    this.eat(OpenSquare);
    let parts = [];
    while (true) {
      parts.push(this.parseCharacterLiteralOrRange());
      if (this.tryEat(CloseSquare))
        return parts.length == 1 ? parts[0] : new Union(parts);
      this.eat(Comma);
    }
  }
  parseGroup() {
    this.eat(OpenParen);
    let expression = this.parseExpression();
    this.eat(CloseParen);
    return new Group(expression);
  }
  parseTerm() {
    switch (this.peek().constructor) {
      case Dot: return this.eat(Dot);
      case StringLiteral: return this.eat(StringLiteral);
      case OpenSquare: return this.parseCharacterSet();
      case OpenParen: return this.parseGroup();
      default: throw new Error("Expected term.");
    }
  }
  parseTermOrRepetition() {
    let term = this.parseTerm();
    if (this.end()) return term;
    switch (this.tokens[this.position].constructor) {
      case Asterisk: this.eat(Asterisk); return new ZeroOrMore(term);
      case Plus: this.eat(Plus); return new OneOrMore(term);
      case QuestionMark: this.eat(QuestionMark); return new Optional(term);
      default: return term;
    }
  }
  parseSequence() {
    const termLookaheads = [Dot, StringLiteral, OpenSquare, OpenParen];
    let parts = [];
    while (true) {
      if (this.end() || termLookaheads.indexOf(this.peek().constructor) == -1)
        return parts.length == 1 ? parts[0] : new Sequence(parts);
      parts.push(this.parseTermOrRepetition());
    }
  }
  parseExpression() {
    let parts = [this.parseSequence()];
    while (!this.end() && this.peek().constructor == Pipe) {
      this.eat(Pipe);
      parts.push(this.parseSequence());
    }
    return parts.length == 1 ? parts[0] : new Union(parts);
  }
  parse() {
    let expression = this.parseExpression();
    if (!this.end())
      throw new Error("Trailing tokens after regular expression.");
    return expression;
  }
}
