const Type = {
  UNKNOWN: ["UNKNOWN"],
  VOID: ["VOID"],
  BOOL: ["BOOL"],
  INT: ["INT"],
  FLOAT: ["FLOAT"],
  STRING: ["STRING"],
  FUNCTION: class {
    constructor(compile) {
      this.compile = compile;
      this.versions = new Map();
    }
    get(location, ...argTypes) {
      const key = "(" + argTypes.map(printType).join(", ") + ")";
      if (!this.versions.has(key)) {
        this.versions.set(key, {
          location,
          value: this.compile(location, ...argTypes),
        });
      }
      return this.versions.get(key).value;
    }
    toJSON() { return "<function>" }
  },
  ARRAY: class {
    constructor(elementType) {
      this.elementType = elementType;
    }
    toJSON() { return "[]" + this.elementType.toJSON() }
  },
  PROMISE: class {
    constructor(valueType) {
      this.valueType = valueType;
    }
    toJSON() { return "promise<" + this.valueType.toJSON() + ">" }
  }
};

Type.UNKNOWN.toJSON = () => "<unknown>";
Type.VOID.toJSON = () => "void";
Type.BOOL.toJSON = () => "bool";
Type.INT.toJSON = () => "int";
Type.FLOAT.toJSON = () => "float";
Type.STRING.toJSON = () => "string";

function printType(type) { return type.toJSON() }

function isNumericType(type) { return type == Type.INT || type == Type.FLOAT; }

class Expression {
  constructor(type) {
    this.type = type;
    this.category = "rvalue";
  }
}

const badExpr = new Expression(Type.UNKNOWN);

class Literal extends Expression {
  constructor(type, value) {
    super(type);
    this.value = value;
  }
}

class VariableReference extends Expression {
  constructor(entry) {
    super(entry.type);
    this.entry = entry;
    this.category = "lvalue";
  }
}

class LogicalAnd extends Expression {
  constructor(l, r) {
    super(Type.BOOL);
    this.left = l;
    this.right = r;
  }
}

class LogicalOr extends Expression {
  constructor(l, r) {
    super(Type.BOOL);
    this.left = l;
    this.right = r;
  }
}

class LogicalNot extends Expression {
  constructor(expr) {
    super(Type.BOOL);
    this.expr = expr;
  }
}

class Compare extends Expression {
  constructor(op, l, r) {
    super(Type.BOOL);
    this.op = op;
    this.left = l;
    this.right = r;
  }
}

class Negate extends Expression {
  constructor(expr) {
    super(expr.type);
    this.expr = expr;
  }
}

function assertSameType(left, right) {
  if (printType(left) != printType(right)) {
    throw new Error(printType(left) + " != " + printType(right));
  }
}

class Add extends Expression {
  constructor(left, right) {
    super(left.type);
    assertSameType(left.type, right.type);
    this.left = left;
    this.right = right;
  }
}

class Sub extends Expression {
  constructor(left, right) {
    super(left.type);
    assertSameType(left.type, right.type);
    this.left = left;
    this.right = right;
  }
}

class Mul extends Expression {
  constructor(left, right) {
    super(left.type);
    assertSameType(left.type, right.type);
    this.left = left;
    this.right = right;
  }
}

class Div extends Expression {
  constructor(left, right) {
    super(left.type);
    assertSameType(left.type, right.type)
    this.left = left;
    this.right = right;
  }
}

class FunctionDefinition {
  constructor(name) {
    this.name = name;
  }
}

class FunctionInstance {
  constructor(isAsync, returnType, name, params, alloc, body) {
    // A function may be sync but return a promise, so we need a separate
    // indicator to mark that a function body is async.
    this.isAsync = isAsync;
    this.returnType = returnType;
    this.name = name;
    this.params = params;  // [NameEntry]
    this.alloc = alloc;
    if (body === undefined) debugger;
    this.body = body;
  }
}

class ReturnStatement {
  constructor(expr) {
    this.expr = expr;
  }
}

class Call extends Expression {
  constructor(f, args) {
    super(f.returnType);
    this.callee = f;
    this.args = args;
  }
}

class IfStatement {
  constructor(condition, thenAlloc, thenBranch, elseAlloc, elseBranch) {
    this.condition = condition;
    this.thenAlloc = thenAlloc;
    this.thenBranch = thenBranch;
    this.elseAlloc = elseAlloc;
    this.elseBranch = elseBranch;
  }
}

class WhileStatement {
  constructor(condition, alloc, body) {
    this.condition = condition;
    this.alloc = alloc;
    this.body = body;
  }
}

class IntToFloat extends Expression {
  constructor(expr) {
    super(Type.FLOAT);
    this.expr = expr;
  }
}

class IntToString extends Expression {
  constructor(expr) {
    super(Type.STRING);
    this.expr = expr;
  }
}

class FloatToString extends Expression {
  constructor(expr) {
    super(Type.STRING);
    this.expr = expr;
  }
}

class PostDecrement extends Expression {
  constructor(expr) {
    super(Type.INT);
    this.expr = expr;
  }
}

class PostIncrement extends Expression {
  constructor(expr) {
    super(Type.INT);
    this.expr = expr;
  }
}

class PreDecrement extends Expression {
  constructor(expr) {
    super(Type.INT);
    this.expr = expr;
  }
}

class PreIncrement extends Expression {
  constructor(expr) {
    super(Type.INT);
    this.expr = expr;
  }
}

class Await extends Expression {
  constructor(expr) {
    if (!(expr.type instanceof Type.PROMISE))
      throw new Error("not a promise.");
    super(expr.type.valueType);
    this.expr = expr;
  }
}

class Assign {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }
}

function alloc(env) {
  return [...env.entries]
      .filter(([k, v]) => k.substr(0, 1) != "$")
      .filter(([k, v]) => !(v.type instanceof Type.FUNCTION))
      .map(([k, v]) => ({name: v.fullName(), type: v.type}));
}

class Label {
  constructor(name) {
    if (!Label.counts.has(name)) {
      Label.counts.set(name, 0);
    }
    let id = Label.counts.get(name) + 1;
    Label.counts.set(name, id);
    this.name = name + id;
  }
}
Label.counts = new Map;

class Goto {
  constructor(label) {
    this.label = label;
  }
}

class Program {
  constructor(functions, globals, init) {
    this.functions = functions;  // map from name to FunctionInstance
    this.globals = globals;  // array of {name, type} entries.
    this.init = init;  // array of initialization steps.
  }
}

class NameEntry {
  constructor(location, uid, name, type) {
    this.location = location;
    this.uid = uid;
    this.name = name;
    this.type = type;
  }
  fullName() {
    if (this.name.substr(0, 2) == "__") return "__t" + this.uid;
    return "ss_" + this.name + this.uid;
  }
}

class Environment {
  constructor(parent = null) {
    this.parent = parent;
    this.entries = new Map();
  }
  lookup(name) {
    if (this.entries.has(name)) return this.entries.get(name);
    if (this.parent) return this.parent.lookup(name);
    return null;
  }
  define(location, name, type) {
    if (this.entries.has(name)) {
      error(location, "redefinition of '" + name + "'.");
      note(this.entries.get(name).location, "previous definition is here.");
      return false;
    } else {
      this.entries.set(
          name, new NameEntry(location, Environment.nextId++, name, type));
      return true;
    }
  }
}
Environment.nextId = 0;

function printAst(ast) {
  function isType(x) {
    return x == Type.UNKNOWN || x == Type.VOID || x == Type.BOOL ||
           x == Type.INT || x == Type.FLOAT || x == Type.STRING ||
           x instanceof Type.FUNCTION || x instanceof Type.ARRAY ||
           x instanceof Type.PROMISE;
  }
  function printValue(value, indent) {
    if (isType(value)) return value.toJSON();
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value == "number") return value.toString();
    if (typeof value == "string") return JSON.stringify(value);
    if (value instanceof Array) {
      if (value.length == 0) return "[]";
      let output = "[\n";
      for (let x of value) {
        output += " ".repeat(indent + 2) + printValue(x, indent + 2) + ",\n";
      }
      output += " ".repeat(indent) + "]";
      return output;
    } else if (value instanceof Map) {
      if (value.size == 0) return "{}";
      let output = "{\n";
      for (let [k, v] of value) {
        output += " ".repeat(indent + 2) + printValue(k, indent + 2) + ": " +
                  printValue(v, indent + 2) + ",\n";
      }
      output += " ".repeat(indent) + "}";
      return output;
    } else {
      if (value == null) return "null";
      let output = value.constructor.name + "{\n";
      for (let k in value) {
        output += " ".repeat(indent + 2) + "." + k + " = " +
                  printValue(value[k], indent + 2) + ",\n";
      }
      output += " ".repeat(indent) + "}";
      return output;
    }
  }
  return printValue(ast, 0);
}
