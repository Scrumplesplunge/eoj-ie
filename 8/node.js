class Node {
  constructor(type, location, value) {
    if (arguments.length != 3)
      throw Error(":(");
    this.type = type;
    this.location = location;
    this.value = value;
  }

  toString() {
    switch (this.type) {
      case Node.STRING: return JSON.stringify(this.value);
      case Node.QUOTE: return "'" + this.value.toString();
      case Node.NUMBER: return this.value.toString();
      case Node.SYMBOL: return this.value.toString();
      case Node.LIST:
        return "(" + this.value.map(x => x.toString()).join(" ") + ")";
      default:
        return "<" + Node[this.type] + ">";
    }
  }
}

// Symbols for node types.
function defineNodeType(type) {
  Node[type] = Symbol(type);
  Node[Node[type]] = type;
}

defineNodeType("LAMBDA");
defineNodeType("LIST");
defineNodeType("MACRO");
defineNodeType("NUMBER");
defineNodeType("QUOTE");
defineNodeType("STRING");
defineNodeType("SYMBOL");

// Singletons for special constants.
Node.NIL = new Node(Node.LIST, null, []);
Node.TRUE = new Node(Node.SYMBOL, null, "true");
Node.FALSE = new Node(Node.SYMBOL, null, "false");
