function MatchAny() {}
function MatchChar(c) { this.c = c; }
function MatchRange(a, b) { this.a = a; this.b = b; }
function Jump(address) { this.address = address; }
function Split(address) { this.address = address; }
function Save(register) { this.register = register; }

class RunningState {
  constructor(program) {
    this.program = program;
    this.position = 0;
    this.threads = null;
    this.newThreads = new Map;
    this.addNewThread(0, []);
    this.swapThreads();
    this.advanceAll();
  }
  addThread(thread) {
    if (!this.newThreads.has(thread.instruction))
      this.newThreads.set(thread.instruction, thread);
  }
  addNewThread(instruction, registers) {
    let thread = new Thread(this, instruction, registers);
    thread.advance();
    this.addThread(thread);
  }
  swapThreads() {
    this.threads = this.newThreads;
    this.newThreads = new Map;
  }
  advanceAll() {
    for (let [_, thread] of this.threads) thread.advance();
    this.swapThreads();
  }
  step(c) {
    for (let [_, thread] of this.threads) thread.consume(c);
    this.swapThreads();
    this.position++;
    this.advanceAll();
  }
  accept() {
    if (!this.threads.has(this.program.length)) return null;
    return this.threads.get(this.program.length);
  }
}

class Thread {
  constructor(state, instruction, registers) {
    this.state = state;
    this.instruction = instruction;
    this.registers = new Map(registers);
  }
  // Repeatedly evaluate any non-consuming instructions until the next
  // operation is either a consuming operation or is at the end of the program.
  advance() {
    while (this.instruction < this.state.program.length) {
      let op = this.state.program[this.instruction];
      switch (op.constructor) {
        case Jump:
          this.instruction = op.address;
          break;
        case Split:
          this.instruction++;
          this.state.addNewThread(op.address, this.registers);
          break;
        case Save:
          this.registers.set(op.register, this.state.position);
          this.instruction++;
          break;
        default:
          this.state.addThread(this);
          return;
      }
    }
    this.state.addThread(this);
  }
  consume(c) {
    // Falling off the end of the program means there is no match.
    if (this.instruction >= this.state.program.length) return;
    let op = this.state.program[this.instruction++];
    switch (op.constructor) {
      case MatchAny:
        this.state.addThread(this);
        break;
      case MatchChar:
        if (c == op.c) this.state.addThread(this);
        break;
      case MatchRange:
        if (op.a <= c && c <= op.b) this.state.addThread(this);
        break;
      default:
        throw new Error("Non-consuming operation in consume().");
    }
  }
}
