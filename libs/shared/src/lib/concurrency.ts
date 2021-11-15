

export class Concurrency {
  private runningTasks = 0;

  constructor(private maxConcurrency = 5) {}

  limitReached(): boolean {
    return this.runningTasks >= this.maxConcurrency;
  }

  increment() {
    if (this.runningTasks < this.maxConcurrency) {
      this.runningTasks++;
    }
  }

  decrement() {
    if (this.runningTasks > 0) {
      this.runningTasks--;
    }
  }
}