// An AsyncBarrier can be used to perform a task once several other async tasks
// have completed. It works by generating callbacks that can be invoked by the
// dependency tasks, and invoking the final callback only once all dependencies
// have finished.
//
// Example:
//
// var barrier = new AsyncBarrier;
// firstAsyncTask(barrier.increment());  // increment() returns a callback.
// secondAsyncTask(barrier.increment());
// barrier.wait(finalCallback);
class AsyncBarrier {
  constructor() {
    this.count = 0;
    this.callback = null;
  }
  increment(callback) {
    this.count++;
    if (callback) {
      return () => { callback(); this.decrement(); };
    } else {
      return () => this.decrement();
    }
  }
  decrement() {
    this.count--;
    if (this.count < 0) throw Error("AsyncBarrier decremented too many times.");
    if (this.count > 0) return;
    if (this.callback) schedule(this.callback);
  }
  wait(callback) {
    if (this.count > 0) {
      this.callback = callback;
    } else {
      schedule(callback);
    }
  }
}
