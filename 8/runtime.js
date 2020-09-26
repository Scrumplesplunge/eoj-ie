class Runtime {
  constructor() {
    this.environment = new Environment(null);
    this.output = "";
  }

  error(message) {
    return new Error("Runtime error: " + message);
  }

  addValue(name, value) { this.environment.define(name, value); }

  addOperation(type, name, f) {
    this.environment.define(name, new Node(type, null, f));
  }

  addMacro(name, f) { this.addOperation(Node.MACRO, name, f); }
  addFunc(name, f) { this.addOperation(Node.LAMBDA, name, f); }

  addFold(name, inputType, outputType, unit, fold) {
    function step(a, b) {
      if (b.type != inputType) {
        throw this.error(b.location,
                         "Invalid type for " + name + ": Expected " +
                         inputType + ", got " + b.type + ".");
      }
      return new Node(outputType, null, fold(a.value, b.value));
    }

    function lambda(environment, args) {
      if (args.length == 0) return unit;
      if (args.length == 1) return step(unit, args[0]);
      if (args[0].type != outputType) {
        throw this.error(
            "Invalid type for " + name + ": Expected " + Node[outputType] +
            ", got " + Node[args[0].type] + ".");
      }
      return args.reduce(step);
    }

    this.addOperation(Node.LAMBDA, name, lambda);
  }

  addPairwiseCompare(name, f) {
    function lambda(environment, args) {
      if (!args.every(x => x.type == Node.NUMBER) &&
          !args.every(x => x.type == Node.STRING)) {
        throw this.error("Invalid type for " + name + ": Only number and " +
                         "string comparisons are supported.");
      }
      var result = true;
      for (var i = 1, n = args.length; i < n; i++)
        result = result && f(args[i - 1].value, args[i].value);
      return result ? Node.TRUE : Node.FALSE;
    }

    this.addOperation(Node.LAMBDA, name, lambda);
  }

  eval(environment, lisp) {
    switch (lisp.type) {
      case Node.NUMBER: return lisp;
      case Node.STRING: return lisp;
      case Node.LAMBDA: return lisp;
      case Node.QUOTE: return lisp.value;
      case Node.SYMBOL: return environment.get(lisp.value);
      case Node.LIST:
        if (lisp.value.length == 0) return lisp;
        var operation = this.eval(environment, lisp.value[0]);
        var args = lisp.value.slice(1);
        switch (operation.type) {
          case Node.MACRO:
            return operation.value(environment, args);
          case Node.LAMBDA:
            var values = args.map(x => this.eval(environment, x));
            return operation.value(environment, values);
          default:
            throw this.error("Tried to call " + Node[operation.type]);
        }
      default:
        throw this.error("Cannot evaluate " + Node[lisp.type] + ".");
    }
  }

  run(text) {
    var parser = new Parser(text);
    parser.parse().forEach(x => this.eval(this.environment, x));
  }
}
