function parse(source) {
  let input = lex(source);
  let next = input.next().value;
  function error(message) {
    return new Error(next.location.formatMessage("error: " + message));
  }
  function done() {
    return next.type == "EOF";
  }
  function peek() {
    if (done()) throw error("unexpected end of input.");
    return next;
  }
  function pop() {
    const token = peek();
    next = input.next().value;
    return token;
  }
  function exact(want) {
    const got = peek().value;
    if (got != want) {
      throw error("expected '" + want + "', got '" + got + "'.");
    }
    return pop();
  }
  function ofType(want) {
    const got = peek().type;
    if (got != want) {
      throw error("expected " + want + ", got " + got + ".");
    }
    return pop();
  }
  function parseAtom() {
    const token = peek();
    switch (token.type) {
      case "INT":
      case "FLOAT":
      case "STRING":
      case "NAME":
        return pop();
      case "BRACKET":
        if (token.value == "(") {
          exact("(");
          const result = parseCondition();
          exact(")");
          return result;
        }
        // Otherwise, fall through.
      default:
        throw error("expected any term.");
    }
  }
  function parseCommaSeparated(parseNextLevel) {
    const result = [parseNextLevel()];
    while (true) {
      if (done()) return result;
      if (peek().value != ",") return result;
      pop();
      result.push(parseNextLevel());
    }
  }
  function parseTerm() {
    let term = parseAtom();
    while (true) {
      if (done()) return term;
      const {value, location} = peek();
      switch (value) {
        case "(":
          pop();
          const args = peek().value == ")"
                ? [] : parseCommaSeparated(parseExpression);
          exact(")");
          term = {type: "CALL", location, callee: term, args};
          break;
        case "[":
          pop();
          const index = parseExpression();
          exact("]");
          term = {type: "INDEX", location, expr: term, index};
          break;
        case ".":
          pop();
          term = {type: "MEMBER", location, expr: term, member: ofType("NAME")};
          break;
        case "++":
          pop();
          term = {type: "POST_INC", location, expr: term};
          break;
        case "--":
          pop();
          term = {type: "POST_DEC", location, expr: term};
          break;
        default:
          return term;
      }
    }
  }
  function parseUnary() {
    const {location, value} = peek();
    switch (value) {
      case "-":
        pop();
        return {type: "NEG", location, expr: parseUnary()};
      case "!":
        pop();
        return {type: "NOT", location, expr: parseUnary()};
      case "await":
        pop();
        return {type: "AWAIT", location, expr: parseUnary()};
      case "++":
        pop();
        return {type: "PRE_INC", location, expr: parseUnary()};
      case "--":
        pop();
        return {type: "PRE_DEC", location, expr: parseUnary()};
      default:
        return parseTerm();
    }
  }
  function parsePrecedence(parseNextLevel, symbols) {
    let left = parseNextLevel();
    while (true) {
      if (done()) return left;
      const token = peek();
      if (!symbols.has(token.value)) return left;
      pop();
      left = {
        type: symbols.get(token.value),
        location: token.location,
        left,
        right: parseNextLevel(),
      };
    }
  }
  function parseProduct() {
    return parsePrecedence(parseUnary, new Map([
      ["*", "MUL"],
      ["/", "DIV"],
    ]));
  }
  function parseExpression() {
    return parsePrecedence(parseProduct, new Map([
      ["+", "ADD"],
      ["-", "SUB"],
    ]));
  }
  function parseBinary(parseNextLevel, operators) {
    const left = parseNextLevel();
    if (done()) return left;
    const token = peek();
    if (!operators.has(token.value)) return left;
    pop();
    return {
      type: operators.get(token.value),
      location: token.location,
      left,
      right: parseNextLevel(),
    };
  }
  function parseComparison() {
    return parseBinary(parseExpression, new Map([
      ["==", "EQ"],
      ["!=", "NE"],
      ["<", "LT"],
      ["<=", "LE"],
      [">", "GT"],
      [">=", "GE"],
    ]));
  }
  function parseConjunction() {
    return parsePrecedence(parseComparison, new Map([["&&", "AND"]]));
  }
  function parseCondition() {
    return parsePrecedence(parseConjunction, new Map([["&&", "AND"]]));
  }
  function parseAssignment() {
    const result = parseBinary(parseExpression, new Map([
      ["=", "ASSIGN"],
      ["+=", "ADD_EQUALS"],
      ["-=", "SUB_EQUALS"],
      ["*=", "MUL_EQUALS"],
      ["/=", "DIV_EQUALS"],
    ]));
    exact(";");
    return result;
  }
  function parseDeclaration() {
    const {location} = exact("let");
    const name = ofType("NAME");
    exact("=");
    const expr = parseExpression();
    exact(";");
    return {type: "DECLARE", location, name, expr};
  }
  function parseIfStatement() {
    const {location} = exact("if");
    const condition = parseCondition();
    exact("{");
    const thenBranch = parseStatements();
    exact("}");
    let elseBranch = [];
    if (!done() && peek().value == "else") {
      pop();
      if (peek().value == "if") {
        elseBranch = [parseIfStatement()];
      } else {
        exact("{");
        elseBranch = parseStatements();
        exact("}");
      }
    }
    return {type: "IF", location, condition, thenBranch, elseBranch};
  }
  function parseWhileStatement() {
    const {location} = exact("while");
    const condition = parseCondition();
    exact("{");
    const body = parseStatements();
    exact("}");
    return {type: "WHILE", location, condition, body};
  }
  function parseReturnStatement() {
    const {location} = exact("return");
    if (peek().value == ";") {
      return {type: "RETURN", location, expr: {type: "VOID", location}};
    }
    const expr = parseExpression();
    exact(";");
    return {type: "RETURN", location, expr};
  }
  function parsePrintStatement() {
    const {location} = exact("print");
    const expr = parseExpression();
    exact(";");
    return {type: "PRINT", location, expr};
  }
  function parseStatement() {
    switch (peek().value) {
      case "let": return parseDeclaration();
      case "if": return parseIfStatement();
      case "while": return parseWhileStatement();
      case "return": return parseReturnStatement();
      case "print": return parsePrintStatement();
      default: return parseAssignment();
    }
  }
  function parseStatements() {
    const result = [];
    while (true) {
      if (done()) return result;
      if (peek().value == "}") return result;
      result.push(parseStatement());
    }
  }
  function parseFunction() {
    const {value, location} = peek();
    if (peek().value == "async") pop();
    exact("function");
    const name = ofType("NAME");
    exact("(");
    const params = peek().value == ")" ? [] : parseCommaSeparated(() => ofType("NAME"));
    exact(")");
    exact("{");
    const body = parseStatements();
    exact("}");
    return {
      type: value == "async" ? "ASYNC_FUNCTION" : "FUNCTION",
      location,
      name,
      params,
      body,
    };
  }
  function parseProgram() {
    if (done()) throw error("program must not be empty.");
    const declarations = [];
    while (!done()) {
      switch (peek().value) {
        case "let":
          declarations.push(parseDeclaration());
          break;
        case "async":
        case "function":
          declarations.push(parseFunction());
          break;
        default:
          throw error("expecting declaration.");
      }
    }
    return declarations;
  }
  return parseProgram();
}
