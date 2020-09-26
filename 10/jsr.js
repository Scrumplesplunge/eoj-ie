class Regex {
  constructor(pattern) {
    let {groups, program} = (new Compiler(pattern)).compile();
    this.groups = groups;
    this.program = program;
  }
  match(text) {
    let state = new RunningState(this.program);
    for (let c of text) state.step(c);
    let thread = state.accept();
    if (thread == null) return null;
    let match = new Map;
    for (let [group, [groupStart, groupEnd]] of this.groups) {
      if (!thread.registers.has(groupStart)) continue;
      if (!thread.registers.has(groupEnd)) continue;
      let start = thread.registers.get(groupStart);
      let end = thread.registers.get(groupEnd);
      match.set(group, text.substr(start, end - start));
    }
    return match;
  }
}
