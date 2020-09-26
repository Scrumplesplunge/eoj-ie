function addPrelude(runtime) {
  function operationMacro(type, environment, args) {
    if (args.length != 2 ||
        args[0].type != Node.LIST ||
        args[0].value.some(x => x.type != Node.SYMBOL)) {
      throw runtime.error("Malformed " + Node[type] + " expression.");
    }
    var variableNames = args[0].value.map(x => x.value);
    var expression = args[1];
    var operation = (environment, args) => {
      if (args.length != variableNames.length) {
        throw runtime.error(
            "Incorrect number of arguments for " + Node[type] + ": Expected " +
            variableNames.length + " but " + args.length + " were given.");
      }
      environment = new Environment(environment);
      for (var i = 0, n = variableNames.length; i < n; i++) {
        environment.define(variableNames[i], args[i]);
      }
      return runtime.eval(environment, expression);
    }
    return new Node(type, null, operation);
  }

  // Basic constants.
  runtime.addValue("true", Node.TRUE);
  runtime.addValue("false", Node.FALSE);
  runtime.addValue("nil", Node.NIL);

  // Arithmetic.
  runtime.addFold("+", Node.NUMBER, Node.NUMBER, 0, (a, b) => a + b);
  runtime.addFold("-", Node.NUMBER, Node.NUMBER, 0, (a, b) => a - b);
  runtime.addFold("*", Node.NUMBER, Node.NUMBER, 1, (a, b) => a * b);
  runtime.addFold("/", Node.NUMBER, Node.NUMBER, 1, (a, b) => a / b);

  // String operations.
  runtime.addFold("++", Node.STRING, Node.STRING, "", (a, b) => a + b);

  // Comparisons.
  runtime.addPairwiseCompare("<", (a, b) => a < b);
  runtime.addPairwiseCompare(">", (a, b) => a > b);
  runtime.addPairwiseCompare("<=", (a, b) => a <= b);
  runtime.addPairwiseCompare(">=", (a, b) => a >= b);
  runtime.addPairwiseCompare("=", (a, b) => a == b);
  runtime.addFunc("/=", function(environment, args) {
    var n = args.length;
    for (var i = 0; i < n; i++) {
      var first = args[i];
      for (var j = i + 1; j < n; j++) {
        var second = args[j];
        if (first.type == second.type && first.value == second.value)
          return Node.FALSE;
      }
    }
    return Node.TRUE;
  });

  // Functions.
  runtime.addFunc("write", function(environment, args) {
    for (var i = 0, n = args.length; i < n; i++) {
      if (args[i].type == Node.STRING || args[i].type == Node.NUMBER) {
        runtime.output += args[i].value.toString();
      } else {
        throw runtime.error("Cannot write node of type " + Node[args[i].type]);
      }
		}
    return Node.NIL;
  });

  runtime.addFunc("show", function(environment, args) {
		if (args.length != 1) throw runtime.error("show requires an argument.");
		return new Node(Node.STRING, null, args[0].toString());
  });

  runtime.addFunc("print", function(environment, args) {
    if (args.length != 1)
      throw runtime.error("print requires exactly one argument.");
    runtime.output += args[0].toString();
    return Node.NIL;
  });

  runtime.addFunc("list", function(environment, args) {
    return new Node(Node.LIST, null, args);
  });

  runtime.addFunc("head", function(environment, args) {
    if (args.length != 1 || args[0].type != Node.LIST)
      throw runtime.error("head expects one argument which is a list.");
    return args[0].value[0];
  });

  runtime.addFunc("tail", function(environment, args) {
    if (args.length != 1 || args[0].type != Node.LIST)
      throw runtime.error("tail expects one argument which is a list.");
    return new Node(Node.LIST, null, args[0].value.slice(1));
  });

  runtime.addFunc("index", function(environment, args) {
    if (args.length != 2 ||
        args[0].type != Node.NUMBER ||
        args[1].type != Node.LIST) {
      throw runtime.error("Bad invocation of index.");
    }
    var index = Math.floor(args[0].value);
    var array = args[1].value;
    if (index < 0 || array.length <= index)
      throw runtime.error("Index out of bounds: " + index);
    return array[index];
  });

  runtime.addFunc("cons", function(environment, args) {
    if (args.length != 2 || args[1].type != LIST)
      throw runtime.error("Bad invocation of cons.");
    return new Node(Node.LIST, null, [args[0]].concat(args[1].value));
  });

  runtime.addFunc("concat", function(environment, args) {
    if (!args.every(x => x.type == Node.LIST))
      throw runtime.error("Bad invocation of concat.");
    return args.reduce(
        (x, y) => new Node(Node.LIST, null, x.value.concat(y.value)));
  });

  runtime.addFunc("map", function(environment, args) {
    if (args.length != 2 ||
        (args[0].type != Node.LAMBDA && args[0].type != Node.MACRO) ||
        args[1].type != Node.LIST) {
      throw runtime.error("Bad invocation of map.");
    }
    var operation = args[0].value;
    var list = args[1].value;
    return new Node(Node.LIST, null,
                    list.map(x => operation(environment, [x])));
  });

  // Macros.
  runtime.addMacro("cond", function(environment, args) {
    if (!args.every(x => x.type == Node.LIST && x.value.length == 2))
      throw runtime.error("Malformed cond expression.");
    for (var i = 0, n = args.length; i < n; i++) {
      var condition = args[i].value[0];
      var conditionResult = runtime.eval(environment, condition);
      if (conditionResult.type != Node.SYMBOL) {
        throw runtime.error(
            "Condition evaluates to type " + Node[conditionResult.type] + ".");
      }
      if (conditionResult.value == "true") {
        return runtime.eval(environment, args[i].value[1]);
      } else if (conditionResult.value != "false") {
        throw runtime_error("Condition evaluates to neither true nor false.");
      }
    }
    return Node.NIL;
  });

  runtime.addMacro("define", function(environment, args) {
    if (args.length != 2 || args[0].type != Node.SYMBOL)
      throw runtime.error(null, "Malformed define expression.");
    var value = runtime.eval(environment, args[1]);
    environment.define(args[0].value, value);
    return value;
  });

  runtime.addMacro("eval", function(environment, args) {
    if (args.length != 1)
      throw runtime.error("Malformed eval expression.");
    return runtime.eval(environment, runtime.eval(environment, args[0]));
  });

  runtime.addMacro("function", function(environment, args) {
    if (args.length != 3 ||
        args[0].type != Node.SYMBOL ||
        args[1].type != Node.LIST ||
        args[1].value.some(x => x.type != Node.SYMBOL)) {
      throw this.error("Malformed function definition.");
    }
    var lambda = operationMacro(Node.LAMBDA, environment, args.slice(1));
    environment.define(args[0].value, lambda);
    return lambda;
  });

  runtime.addMacro("let", function(environment, args) {
    if (args.length != 2 ||
        args[0].type != Node.LIST ||
        !args[0].value.every(x => x.type == Node.LIST &&
                             x.value.length == 2 &&
                             x.value[0].type == Node.SYMBOL)) {
      throw runtime.error("Malformed let expression.");
    }
    var newEnvironment = new Environment(environment);
    var assignments = args[0].value;
    var n = assignments.length;
    for (var i = 0; i < n; i++) {
      newEnvironment.define(
          assignments[i].value[0].value,
          runtime.eval(environment, assignments[i].value[1]));
    }
    return runtime.eval(newEnvironment, args[1]);
  });

  runtime.addMacro("lambda", operationMacro.bind(this, Node.LAMBDA));
  runtime.addMacro("macro", operationMacro.bind(this, Node.MACRO));
  
  runtime.addMacro("set", function(environment, args) {
    if (args.length != 2 || args[0].type != Node.SYMBOL)
      throw runtime.error("Malformed set expression.");
    var value = runtime.eval(environment, args[1]);
    environment.set(args[0].value, value);
    return value;
  });
}
