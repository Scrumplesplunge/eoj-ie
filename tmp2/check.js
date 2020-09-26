function check(ast) {
  const count = {error: 0, warning: 0, note: 0};
  const messages = [];
  function message(prefix) {
    return (location, text) => {
      messages.push(location.formatMessage(prefix + ": " + text));
      count[prefix]++;
    }
  }
  const error = message("error");
  const warning = message("warning");
  const note = message("note");

  function castTo(targetType, expr, location) {
    if (expr.type == Type.UNKNOWN || targetType == Type.UNKNOWN) return expr;
    if (printType(expr.type) == printType(targetType)) return expr;
    if (expr.type == Type.INT && targetType == Type.FLOAT)
      return new IntToFloat(expr);
    if (expr.type == Type.INT && targetType == Type.STRING)
      return new IntToString(expr);
    if (expr.type == Type.FLOAT && targetType == Type.STRING)
      return new FloatToString(expr);
    error(location, "cannot cast from " + printType(expr.type) + " to " +
                    printType(targetType));
    return new Expression(targetType);
  }

  function commonNumericType(
      op, leftLocation, leftType, rightLocation, rightType) {
    const leftNumeric = isNumericType(leftType),
          rightNumeric = isNumericType(rightType);
    if (!leftNumeric) {
      error(leftLocation,
            "invalid left operand type " + printType(leftType) +
            " for binary '" + op + "'.");
    }
    if (!rightNumeric) {
      error(rightLocation,
            "invalid right operand type " + printType(rightType) +
            " for binary '" + op + "'.");
    }
    console.log("compare: %s -> %s, %s -> %s", leftType.toJSON(), leftNumeric,
                rightType.toJSON(), rightNumeric);
    if (leftNumeric && rightNumeric) {
      return leftType == Type.FLOAT || rightType == Type.FLOAT
             ? Type.FLOAT
             : Type.INT;
    } else {
      return Type.UNKNOWN;
    }
  }

  function comparisonType(location, leftType, rightType) {
    if (printType(leftType) == printType(rightType)) return leftType;
    // Types must differ, so if both are numeric then one must be float.
    // Hence, we will use float for comparison.
    if (isNumericType(leftType) && isNumericType(rightType)) return Type.FLOAT;
    // Otherwise, the types don't match and aren't allowed to be directly
    // compared.
    error(location, "cannot compare " + printType(leftType) + " with " +
                    printType(rightType) + ".");
    return Type.UNKNOWN;
  }

  const opSymbol = new Map([
    ["ADD", "+"],
    ["SUB", "-"],
    ["MUL", "*"],
    ["DIV", "/"],
  ]);

  const incDecOps = new Map([
    ["PRE_DEC", PreDecrement],
    ["PRE_INC", PreIncrement],
    ["POST_DEC", PostDecrement],
    ["POST_INC", PostIncrement],
  ]);

  function checkExpression(expr, env) {
    switch (expr.type) {
      case "VOID":
        return new Literal(Type.VOID, null);
      case "INT":
        return new Literal(Type.INT, parseInt(expr.value, 10));
      case "FLOAT":
        return new Literal(Type.FLOAT, parseFloat(expr.value));
      case "STRING":
        return new Literal(Type.STRING, JSON.parse(expr.value));
      case "NAME":
        const v = env.lookup(expr.value);
        if (v == null) {
          error(expr.location, "undefined variable '" + expr.value + "'.");
          return badExpr;
        }
        return new VariableReference(v);
      case "AND":
        return new LogicalAnd(
            castTo(Type.BOOL, checkExpression(expr.left, env),
                   expr.left.location),
            castTo(Type.BOOL, checkExpression(expr.right, env),
                   expr.right.location));
      case "OR":
        return new LogicalOr(
            castTo(Type.BOOL, checkExpression(expr.left, env),
                   expr.left.location),
            castTo(Type.BOOL, checkExpression(expr.right, env),
                   expr.right.location));
      case "NOT":
        return new LogicalNot(castTo(
            Type.BOOL, checkExpression(expr.expr, env), expr.expr.location));
      case "EQ": case "NE":
      case "LT": case "LE":
      case "GT": case "GE": {
        const left = checkExpression(expr.left, env);
        const right = checkExpression(expr.right, env);
        const type = comparisonType(expr.location, left.type, right.type);
        return new Compare(expr.type, castTo(type, left, expr.left.location),
                           castTo(type, right, expr.right.location));
      }
      case "NEG": {
        const inner = checkExpression(expr.expr, env);
        switch (inner.type) {
          case Type.INT:
          case Type.FLOAT:
            return new Negate(inner);
          default:
            error(expr.expr.location,
                  "invalid operand type " + printType(inner.type) +
                  " for unary '-'.");
            return new Expression(Type.UNKNOWN);
        }
        break;
      }
      case "ADD": {
        const left = checkExpression(expr.left, env);
        const right = checkExpression(expr.right, env);
        if (left.type == Type.UNKNOWN) return left;
        if (right.type == Type.UNKNOWN) return right;
        if (left.type == Type.STRING || right.type == Type.STRING) {
          return new Add(castTo(Type.STRING, left, expr.left.location),
                         castTo(Type.STRING, right, expr.right.location));
        }
        const type = commonNumericType(
            opSymbol.get(expr.type), expr.left.location, left.type,
            expr.right.location, right.type);
        if (type == Type.FLOAT || type == Type.INT) {
          return new Add(castTo(type, left), castTo(type, right));
        }
        return new Expression(Type.UNKNOWN);
      }
      case "SUB":
      case "MUL":
      case "DIV": {
        const left = checkExpression(expr.left, env);
        const right = checkExpression(expr.right, env);
        if (left.type == Type.UNKNOWN) return left;
        if (right.type == Type.UNKNOWN) return right;
        const type = commonNumericType(
            opSymbol.get(expr.type),
            expr.left.location, left.type, expr.right.location, right.type);
        const typeMap = new Map([["SUB", Sub], ["MUL", Mul], ["DIV", Div]]);
        const ResultType = typeMap.get(expr.type);
        if (ResultType) {
          return new ResultType(castTo(type, left), castTo(type, right));
        }
        return new Expression(Type.UNKNOWN);
      }
      case "CALL": {
        const f = checkExpression(expr.callee, env);
        const args = expr.args.map(x => checkExpression(x, env));
        if (f.type instanceof Type.FUNCTION) {
          const fType = f.type.get(expr.location, ...args.map(x => x.type));
          return new Call(fType, args);
        } else {
          error(expr.location,
                "cannot call expression of type " + printType(f.type));
          return badExpr;
        }
      }
      case "PRE_DEC": case "PRE_INC":
      case "POST_DEC": case "POST_INC": {
        const inner = checkExpression(expr.expr, env);
        if (inner.type != Type.INT) {
          const op = expr.type.substr(-3) == "INC" ? "increment" : "decrement";
          error(expr.expr.location,
                "cannot " + op + " " + printType(inner.type));
        } else if (inner.category != "lvalue") {
          error(expr.expr.location, "expression is not an lvalue.");
        }
        const IncDecType = incDecOps.get(expr.type);
        return new IncDecType(inner);
      }
      case "AWAIT": {
        if (!env.lookup("$async")) {
          error(expr.location, "await cannot be used in this context.");
        }
        const inner = checkExpression(expr.expr, env);
        if (!(inner.type instanceof Type.PROMISE)) {
          error(expr.expr.location,
                printType(inner.type) + " is not awaitable.");
          return badExpr;
        }
        return new Await(inner);
      }
      default:
        error(expr.location, "no rule in compiler for " + expr.type + ".");
        return new Expression(Type.UNKNOWN);
    }
  }

  function checkDeclaration(decl, env) {
    const expr = checkExpression(decl.expr, env);
    if (decl.name.value.substr(0, 2) == "__") {
      error(decl.name.location, "names may not begin with '__'.");
    }
    if (expr.type instanceof Type.FUNCTION) {
      error(decl.expr.location, "functions may not be used like values.");
    }
    env.define(decl.name.location, decl.name.value, expr.type);
    return new Assign(new VariableReference(decl.name.value), expr);
  }

  function checkReturn(statement, env) {
    const expr = checkExpression(statement.expr, env);
    const r = env.lookup("$return");
    if (expr.type == Type.FUNCTION) {
      error(statement.expr.location, "functions may not be used like values.");
    } else if (r.type == Type.UNKNOWN) {
      r.type = expr.type;
      r.location = statement.expr.location;
    } else if (expr.type != Type.UNKNOWN &&
               printType(r.type) != printType(expr.type)) {
      error(statement.expr.location,
            "deduced conflicting return type " + printType(expr.type) + ".");
      note(r.location, "previously deduced " + printType(r.type) + ".");
    }
    return new ReturnStatement(expr);
  }

  function checkIfStatement(statement, env) {
    const condition = checkExpression(statement.condition, env);
    const thenEnv = new Environment(env);
    const thenBranch = checkStatements(statement.thenBranch, thenEnv);
    const elseEnv = new Environment(env);
    const elseBranch = checkStatements(statement.elseBranch, elseEnv);
    return new IfStatement(
        condition, alloc(thenEnv), thenBranch, alloc(elseEnv), elseBranch);
  }

  function checkWhileStatement(statement, env) {
    const condition = checkExpression(statement.condition, env);
    const whileEnv = new Environment(env);
    const body = checkStatements(statement.body, whileEnv);
    return new WhileStatement(condition, alloc(whileEnv), body);
  }

  function checkAssignment(statement, env) {
    const left = checkExpression(statement.left, env);
    const right = checkExpression(statement.right, env);
    if (left.category != "lvalue") {
      error(statement.left.location, "assignee is not an lvalue.");
    }
    if (left.type != Type.UNKNOWN && right.type != Type.UNKNOWN &&
        left.type.toJSON() != right.type.toJSON()) {
      error(statement.location, "cannot assign " + right.type.toJSON() +
                                " to variable of type " + left.type.toJSON());
    }
    return new Assign(left, right);
  }

  function checkStatements(statements, env) {
    const result = [];
    for (const statement of statements) {
      switch (statement.type) {
        case "DECLARE":
          result.push(checkDeclaration(statement, env));
          break;
        case "ASSIGN":
          result.push(checkAssignment(statement, env));
          break;
        case "RETURN":
          result.push(checkReturn(statement, env));
          break;
        case "IF":
          result.push(checkIfStatement(statement, env));
          break;
        case "WHILE":
          result.push(checkWhileStatement(statement, env));
          break;
        default:
          result.push(checkExpression(statement, env));
          break;
      }
    }
    return result;
  }

  function checkFunction(func, env) {
    function compile(location, ...argTypes) {
      if (argTypes.some(t => t instanceof Type.FUNCTION)) {
        error(location, "cannot pass a function as an argument yet, sorry :(");
        return Type.UNKNOWN;
      }
      if (argTypes.length != func.params.length) {
        error(location, "incorrect number of arguments: expected " +
                        func.params.length + " but " + argTypes.length +
                        " were given.");
        return Type.UNKNOWN;
      }
      const functionScope = new Environment(env);
      const paramDefs = [];
      for (let i = 0, n = argTypes.length; i < n; i++) {
        functionScope.define(
            func.params[i].location, func.params[i].value, argTypes[i]);
        paramDefs.push(functionScope.lookup(func.params[i].value));
      }
      functionScope.define(func.location, "$return", Type.UNKNOWN);
      if (func.type == "ASYNC_FUNCTION") {
        functionScope.define(func.location, "$async", Type.UNKNOWN);
      }
      const bodyScope = new Environment(functionScope);
      const body = checkStatements(func.body, bodyScope);
      const returnInfo = functionScope.lookup("$return");
      const returnValueType =
          returnInfo.location == func.location ? Type.VOID : returnInfo.type;
      const returnType = func.type == "ASYNC_FUNCTION"
                       ? new Type.PROMISE(returnValueType)
                       : returnValueType;
      console.log("(%s) -> %s", argTypes.map(printType).join(", "),
                  printType(returnType));
      return new FunctionInstance(func.type == "ASYNC_FUNCTION",
                                  returnType, func.name.value, paramDefs,
                                  alloc(bodyScope), body);
    }
    if (func.name.value.substr(0, 2) == "__") {
      error(func.name.location, "names may not begin with '__'.");
    }
    env.define(func.location, func.name.value, new Type.FUNCTION(compile));
    return new FunctionDefinition(func.name.value);
  }

  function checkProgram(decls) {
    const globals = new Environment();
    const init = [];
    for (const decl of decls) {
      if (decl.type == "DECLARE") {
        init.push(checkDeclaration(decl, globals));
      } else {
        checkFunction(decl, globals);
      }
    }
    const main = globals.lookup("main");
    if (!main) {
      messages.push("?:?: error: no main function defined.");
      count.error++;
    } else if (!(main.type instanceof Type.FUNCTION)) {
      error(main.location, "main is not a function.");
    }
    const mainFunction = main
        ? main.type.get(main.location)
        : new FunctionInstance(false, new Type.PROMISE(Type.VOID), "main", [],
                               alloc(new Environment(globals)), []);
    if (!(mainFunction.returnType instanceof Type.PROMISE) ||
        mainFunction.returnType.valueType != Type.VOID) {
      error(main.location, "return type of main is " +
                           printType(mainFunction.returnType) +
                           " but should be promise<void>.");
    } else if (mainFunction.params.length != 0) {
      error(main.location, "main must take no parameters.");
    }
    const functions = new Map;
    for (let [name, info] of globals.entries) {
      if (!(info.type instanceof Type.FUNCTION)) continue;
      if (info.type.versions.size == 0) {
        error(info.location, "unused function " + name + ".");
      } else if (info.type.versions.size > 1) {
        error(info.location,
              "deduced multiple types for function " + name + ".");
        for (let {location, value} of info.type.versions) {
          note(location, value.returnType.toJSON() + "(" +
                         value.paramTypes.map(x => x.toJSON()).join(", ") +
                         ") deduced here.");
        }
      } else {
        functions.set(name, [...info.type.versions][0][1].value);
      }
    }
    return new Program(functions, alloc(globals),
                       [...init, new Call(mainFunction, [])]);
  }

  const result = checkProgram(ast);
  if (count.error > 0) throw new Error(messages.join("\n\n"));
  return result;
}
