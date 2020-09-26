function Label() {}
function GroupId() {}
function GroupStart(groupId) { this.groupId = groupId; }
function GroupEnd(groupId) { this.groupId = groupId; }

class Compiler {
  constructor(text) {
    this.tree = (new Parser(text)).parse();
  }
  compileDot(_) {
    return new MatchAny;
  }
  compileStringLiteral(literal) {
    return literal.value.split("").map(c => new MatchChar(c));
  }
  compileCharacterLiteral(literal) {
    return new MatchChar(literal.value);
  }
  compileCharacterRange(range) {
    return new MatchRange(range.a.value, range.b.value);
  }
  compileSequence(set) {
    return set.parts.map(e => this.compileNode(e));
  }
  compileUnion(union) {
    let reducer = (codeA, nodeB) => {
      var labelB = new Label, labelEnd = new Label;
      return [
        new Split(labelB),
        codeA,
        new Jump(labelEnd),
        labelB,
        this.compileNode(nodeB),
        labelEnd,
      ];
    }
    let head = this.compileNode(union.parts[0]);
    let tail = union.parts.slice(1);
    return tail.reduce(reducer, head);
  }
  compileGroup(group) {
    let groupId = new GroupId;
    return [
      new Save(new GroupStart(groupId)),
      this.compileNode(group.expression),
      new Save(new GroupEnd(groupId)),
    ];
  }
  compileZeroOrMore(zeroOrMore) {
    let nextLabel = new Label, endLabel = new Label;
    return [
      new Split(endLabel),
      nextLabel,
      this.compileNode(zeroOrMore.expression),
      new Split(nextLabel),
      endLabel,
    ];
  }
  compileOneOrMore(oneOrMore) {
    let startLabel = new Label;
    return [
      startLabel,
      this.compileNode(oneOrMore.expression),
      new Split(startLabel),
    ];
  }
  compileOptional(optional) {
    let endLabel = new Label;
    return [
      new Split(endLabel),
      this.compileNode(optional.expression),
      endLabel,
    ];
  }
  compileNode(node) {
    switch (node.constructor) {
      case Dot: return this.compileDot(node);
      case StringLiteral: return this.compileStringLiteral(node);
      case CharacterLiteral: return this.compileCharacterLiteral(node);
      case CharacterRange: return this.compileCharacterRange(node);
      case Sequence: return this.compileSequence(node);
      case Union: return this.compileUnion(node);
      case Group: return this.compileGroup(node);
      case ZeroOrMore: return this.compileZeroOrMore(node);
      case OneOrMore: return this.compileOneOrMore(node);
      case Optional: return this.compileOptional(node);
      default:
        throw new Error("Don't know how to compile a " + node.constructor.name);
    }
  }
  static flatten(code) {
    if (code.constructor == Array) {
      return code.map(Compiler.flatten).reduce((a, b) => a.concat(b), []);
    } else {
      return [code];
    }
  }
  compile() {
    let nestedCode = this.compileNode(this.tree);
    let code = Compiler.flatten(nestedCode);
    // Compute the addresses for every label, and group indexes for each group.
    let labels = new Map;
    let groups = new Map;
    let index = 0;
    let groupIndex = 0;
    for (let op of code) {
      if (op.constructor == Label) {
        labels.set(op, index);
      } else {
        index++;
        if (op.constructor == Save && !groups.has(op.register.groupId)) {
          groups.set(op.register.groupId, groupIndex);
          groupIndex++;
        }
      }
    }
    // Rewrite the code with label addresses and register indices inlined.
    let output = [];
    for (let op of code) {
      switch (op.constructor) {
        case Label:
          break;
        case Split:
          output.push(new Split(labels.get(op.address)));
          break;
        case Jump:
          output.push(new Jump(labels.get(op.address)));
          break;
        case Save:
          let group = groups.get(op.register.groupId);
          let isStart = op.register.constructor == GroupStart;
          let register = 2 * group + (isStart ? 0 : 1);
          output.push(new Save(register));
          break;
        default:
          output.push(op);
          break;
      }
    }
    let groupMap = new Map(
        [...groups.values()].sort().map(id => [id, [2 * id, 2 * id + 1]]));
    return {
      groups: groupMap,
      program: output,
    };
  }
}
