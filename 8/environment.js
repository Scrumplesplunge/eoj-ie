class Environment {
  constructor(parent) {
    this.parent = parent;
    this.values = {};
  }

  error(message) {
    return new Error("Runtime error: " + message);
  }

  get(name) {
    if (this.values.hasOwnProperty(name)) return this.values[name];
    if (this.parent != null) return this.parent.get(name);
    throw this.error("Symbol " + name + " has no value.");
  }

  define(name, value) {
    this.values[name] = value;
  }

  set(name, value) {
    if (this.values.hasOwnProperty(name)) {
      this.values[name] = value;
    } else if (this.parent != null) {
      return this.parent.set(name, value);
    } else {
      throw this.error("Symbol " + name + " is not defined.");
    }
  }
}
