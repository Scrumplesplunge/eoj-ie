const boilerplate = `
// BEGIN SS BOILERPLATE

class SS_Delay {
  public SS_Promise<SSVoid> Run(float duration) {
    this.duration = duration;
  }
}

class SSVoid {}

class SSPromise<T> {
  bool ready;
  public T value;
  List<Action> waiters;

  public void Resolve(T x) {
    value = x;
    ready = true;
    foreach (Action a in waiters) {
      ssWorkQueue.Add(a);
    }
    waiters.Clear();
  }

  public void Then(Action action) {
    if (ready) {
      ssWorkQueue.Add(action);
    } else {
      waiters.Add(action);
    }
  }
}

Program() {
  Runtime.UpdateFrequency = UpdateFrequency.Update1;
}

List<Action> ssWorkQueue = new List<Action>();

class SS_SleepingAction {
  public float wakeTime;
  public float action;

  public SS_SleepingAction(float wakeTime, Action action) {
    this.wakeTime = wakeTime;
    this.action = action;
  }
}

List<SS_SleepingAction> ssSleepingActions = new List<SS_SleepingAction>();

float time = 0.0f;
void Main() {
  // Wake any actions that were sleeping.
  time += Storage.TimeSinceLastRun.TotalSeconds;
  while (ssSleepingActions.Count > 0 && ssSleepingActions[0].wakeTime < time) {
    ssWorkQueue.Add(ssSleepingActions[0].action);
    ssSleepingActions.RemoveAt(0);
  }

  // Run any pending work.
  while (ssWorkQueue.Count > 0) {
    let action = ssWorkQueue.RemoveAt(0);
    action();
  }
}
`;

function compile(ast) {
  function correspondingType(type) {
    if (type == Type.VOID) return "SSVoid";
    if (type == Type.BOOL) return "bool";
    if (type == Type.INT) return "int";
    if (type == Type.FLOAT) return "float";
    if (type == Type.STRING) return "string";
    if (type instanceof Type.ARRAY) {
      return correspondingType(type.elementType) + "[]";
    }
    if (type instanceof Type.PROMISE) {
      return "SSPromise<" + correspondingType(type.valueType) + ">";
    }
    throw new Error("No corresponding type for " + printType(type));
  }

  function compileExpression(expr) {
    switch (expr.constructor.name) {
      case "Literal":
        if (expr.type == Type.INT) return expr.value.toString();
        if (expr.type == Type.FLOAT) return expr.value.toString() + "f";
        if (expr.type == Type.STRING) return JSON.stringify(expr.value);
        if (expr.type == Type.VOID) return "null";
        throw new Error("unsupported literal type " + printType(expr.type));
      case "VariableReference": return expr.entry.fullName();
      case "LogicalAnd":
      case "LogicalOr":
      case "Add":
      case "Sub":
      case "Mul":
      case "Div": {
        const ops = new Map([
          ["LogicalAnd", "&&"],
          ["LogicalOr", "||"],
          ["Add", "+"],
          ["Sub", "-"],
          ["Mul", "*"],
          ["Div", "/"],
        ]);
        return "(" + compileExpression(expr.left) + " " +
               ops.get(expr.constructor.name) + " " +
               compileExpression(expr.right) + ")";
      }
      case "IntToFloat": return "(float)" + compileExpression(expr.expr);
      case "IntToString":
      case "FloatToString":
        return compileExpression(expr.expr) + ".ToString()";
      case "PostDecrement": return "(" + compileExpression(expr.expr) + "--)";
      case "PostIncrement": return "(" + compileExpression(expr.expr) + "++)";
      case "PreDecrement": return "(--" + compileExpression(expr.expr) + ")";
      case "PreIncrement": return "(++" + compileExpression(expr.expr) + ")";
      case "Await": return "TODOAWAIT";
      case "Compare": {
        const ops = new Map([
          ["EQ", "=="],
          ["NE", "!="],
          ["LT", "<"],
          ["LE", "<="],
          ["GT", ">"],
          ["GE", ">="],
        ]);
        return "(" + compileExpression(expr.left) + " " + ops.get(expr.op) +
               " " + compileExpression(expr.right) + ")";
      }
      case "Call": {
        return "(new SS_" + expr.callee.name + "()).Run(" +
            expr.args.map(compileExpression).join(", ") + ")";
      }
      default:
        throw new Error(
            "compileExpression: no rule for " + expr.constructor.name);
    }
  }

  function compileStatement(statement, indent) {
    switch (statement.constructor.name) {
      case "Assign":
        return " ".repeat(indent) + compileExpression(statement.left) + " = " +
               compileExpression(statement.right) + ";\n";
      case "ReturnStatement":
        return " ".repeat(indent) + "return " +
               compileExpression(statement.expr) + ";\n";
      case "IfStatement":
        return " ".repeat(indent) + "if (" +
               compileExpression(statement.condition) + ") {\n" +
               compileStatements(statement.thenBranch, indent + 2) +
               " ".repeat(indent) + "} else {\n" +
               compileStatements(statement.elseBranch, indent + 2) +
               " ".repeat(indent) + "}\n";
      case "Label":
        return " ".repeat(indent - 1) + statement.name + ":\n";
      case "Goto":
        return " ".repeat(indent) + "goto " + statement.label.name + ";\n";
      default:
        return " ".repeat(indent) + compileExpression(statement) + ";\n";
    }
  }

  function compileStatements(statements, indent) {
    return statements.map(s => compileStatement(s, indent)).join("");
  }

  function compileAsyncFunction(name, def) {
    let output = "";
    output += "class SS_" + name + " {\n";
    const alloc = [
      ...def.alloc,
      ...def.params.map(n => ({name: n.fullName(), type: n.type})),
    ];
    for (let {name, type} of alloc) {
      output += "  " + correspondingType(type) + " " + name + ";\n";
    }
    const promiseType = correspondingType(def.returnType);
    output += "  " + promiseType + " __return;\n" +
              "  State __state;\n\n";
    const enter = new Label("Enter");
    const end = new Label("End");
    output += "  public " + correspondingType(def.returnType) + " Run(" +
              def.params.map(p =>
                  correspondingType(p.type) + " " + p.fullName()).join(", ") +
              ") {\n" +
              def.params.map(p =>
                  "    this." + p.fullName() + " = " + p.fullName() + ";\n")
                  .join("") +
              "    __return = new " + promiseType + "();\n" +
              "    __state = State." + enter.name + ";\n" +
              "    Resume();\n" +
              "    return __return;\n" +
              "  }\n\n" +
              "  private void Resume() {\n";
    const states = [enter.name, end.name];
    let body = "";
    for (let statement of def.body) {
      if (statement instanceof Assign && statement.right instanceof Await) {
        const label = new Label("Await");
        body += "    __state = State." + label.name + ";\n" +
                "    " + compileExpression(statement.right.expr) +
                     ".then(() => Resume());\n" +
                "    return;\n" +
                "    " + compileExpression(statement.left) + " = " +
                     compileExpression(statement.right.expr) + ".value;\n" +
                "   " + label.name + ":\n";
        states.push(label.name);
      } else {
        body += compileStatement(statement, 4);
      }
    }
    output += "    switch (__state) {\n";
    for (let state of states) {
      output += "      case State." + state + ": goto " +
                state + ";\n";
    }
    output += "    }\n" +
              "   " + enter.name + ":\n" +
              body +
              "   " + end.name + ":\n" +
              "  }\n\n" +
              "  enum State {\n";
    for (let state of states) {
      output += "    " + state + ",\n";
    }
    output += "  }\n" +
              "}\n\n";
    return output;
  }

  function compileSyncFunction(name, def) {
    let output = "";
    output += "class SS_" + name + " {\n";
    for (let {name, type} of def.alloc) {
      output += "  " + correspondingType(type) + " " + name + ";\n";
    }
    output += "\n  public " + correspondingType(def.returnType) + " Run(" +
              def.params.map(p =>
                  correspondingType(p.type) + " " + p.name).join(", ") +
              ") {\n";
    for (let statement of def.body) {
      output += compileStatement(statement, 4);
    }
    output += "  }\n}\n\n";
    return output;
  }

  function compileFunction(name, def) {
    return def.isAsync ? compileAsyncFunction(name, def)
                       : compileSyncFunction(name, def);
  }

  let output = "";
  for (let [name, def] of ast.functions) output += compileFunction(name, def);
  for (let {name, type} of ast.globals) {
    output += correspondingType(type) + " " + name + ";\n";
  }
  if (ast.globals.length > 0) output += "\n";
  output += boilerplate;
  return output;
}
