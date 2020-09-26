// Decompose all composite expressions into sequences of trivial assignments to
// temporaries.
function flatten(program) {
  class TempEnvironment extends Environment {
    constructor(parent = null) {
      super(parent);
      this.nextTemp = 0;
    }
    makeTemp(expr) {
      const name = "__t" + this.nextTemp++;
      this.define(null, name, expr.type);
      return new Assign(new VariableReference(this.lookup(name)), expr);
    }
  }

  // flattenExpr produces two things: a sequence of setup operations which must
  // be executed, and a side-effect free expression which can be used to access
  // the value yielded by the expression.
  function flattenExpr(env, expr) {
    switch (expr.constructor.name) {
      case "Literal":
      case "VariableReference":
        return {pre: [], expr};
      case "IntToFloat":
      case "IntToString":
      case "FloatToString": {
        const e = flattenExpr(env, expr.expr);
        const ex = env.makeTemp(e.expr);
        return {pre: [...e.pre, ex], expr: new expr.constructor(ex.left)};
      }
      case "PreDecrement":
      case "PreIncrement": {
        const e = flattenExpr(env, expr.expr);
        return {
          pre: [...e.pre, new expr.constructor(e.expr)],
          expr: e.expr,
        };
      }
      case "PostDecrement":
      case "PostIncrement": {
        const e = flattenExpr(env, expr.expr);
        const ex = env.makeTemp(e.expr);
        return {
          pre: [...e.pre, ex, new expr.constructor(e.expr)],
          expr: ex.left,
        };
      }
      case "LogicalAnd":
      case "LogicalOr":
      case "Add":
      case "Sub":
      case "Mul":
      case "Div": {
        const l = flattenExpr(env, expr.left);
        const lx = env.makeTemp(l.expr);
        const r = flattenExpr(env, expr.right);
        const rx = env.makeTemp(r.expr);
        return {
          pre: [...l.pre, lx, ...r.pre, rx],
          expr: new expr.constructor(lx.left, rx.left),
        };
      }
      case "Compare": {
        const l = flattenExpr(env, expr.left);
        const lx = env.makeTemp(l.expr);
        const r = flattenExpr(env, expr.right);
        const rx = env.makeTemp(r.expr);
        return {
          pre: [...l.pre, lx, ...r.pre, rx],
          expr: new Compare(expr.op, lx.left, rx.left),
        };
      }
      case "Call": {
        const f = expr.callee;
        const args = expr.args.map(x => flattenExpr(env, x));
        const argTemps = args.map(x => env.makeTemp(x.expr));
        const resultTemp = env.makeTemp(new Call(f, argTemps.map(x => x.left)));
        return {
          pre: [...args.map(x => x.pre).flat(), ...argTemps, resultTemp],
          expr: resultTemp.left,
        }
      }
      case "Await": {
        const e = flattenExpr(env, expr.expr);
        const ex = env.makeTemp(e.expr);
        const resultTemp = env.makeTemp(new Await(ex.left));
        return {pre: [...e.pre, ex, resultTemp], expr: resultTemp.left};
      }
      default:
        throw new Error("flattenExpr: no rule for " + expr.constructor.name);
    }
  }

  function flattenStatement(env, s) {
    switch (s.constructor.name) {
      case "Assign": {
        const l = flattenExpr(env, s.left);
        const r = flattenExpr(env, s.right);
        return {
          alloc: [],
          body: [...l.pre, ...r.pre, new Assign(l.expr, r.expr)],
        };
      }
      case "ReturnStatement": {
        const r = flattenExpr(env, s.expr);
        return {
          alloc: [],
          body: [...r.pre, new ReturnStatement(r.expr)],
        };
      }
      case "IfStatement": {
        const c = flattenExpr(env, s.condition);
        const cx = env.makeTemp(c.expr);
        const elseLabel = new Label("else");
        const endLabel = new Label("end");
        const t = flattenStatements(env, s.thenBranch);
        const e = flattenStatements(env, s.elseBranch);
        return {
          alloc: [...t.alloc, ...e.alloc],
          body: [
            ...c.pre,
            cx,
            new IfStatement(cx.left, null, [], null, [new Goto(elseLabel)]),
            ...t.body,
            new Goto(endLabel),
            elseLabel,
            ...e.body,
            endLabel,
          ],
        };
      }
      case "WhileStatement": {
        const c = flattenExpr(env, s.condition);
        const cx = env.makeTemp(c.expr);
        const whileStartLabel = new Label("whileStart");
        const whileCondLabel = new Label("whileCond");
        const b = flattenStatements(env, s.body);
        return {
          alloc: b.alloc,
          body: [
            new Goto(whileCondLabel),
            whileStartLabel,
            ...b.body,
            whileCondLabel,
            ...c.pre,
            cx,
            new IfStatement(
                cx.left, null, [new Goto(whileStartLabel)], null, []),
          ],
        };
      }
      default: {
        const e = flattenExpr(env, s);
        return {
          alloc: [],
          body: [...e.pre],  // Note: we are discarding the side-effect free op.
        };
      }
    }
  }

  function flattenStatements(env, statements) {
    const alloc = [];
    const body = [];
    for (let statement of statements) {
      const s = flattenStatement(env, statement);
      alloc.push(...s.alloc);
      body.push(...s.body);
    }
    return {alloc, body};
  }

  function flattenFunc(f) {
    let temp = new TempEnvironment;
    const b = flattenStatements(temp, f.body);
    return new FunctionInstance(
        f.isAsync, f.returnType, f.name, f.params,
        [...alloc(temp), ...f.alloc, ...b.alloc], b.body);
  }

  return (function() {
    const functions = new Map;
    for (const [functionName, functionDef] of program.functions) {
      functions.set(functionName, flattenFunc(functionDef));
    }
    const {alloc, body} = flattenStatements(new TempEnvironment, program.init);

    return new Program(functions, [...program.globals, ...alloc], body);
  }());
}
