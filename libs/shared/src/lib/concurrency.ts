

/**
 * Implement a simple count based logic to limit the maximum number of concurrent requests.
 * When a new requests comes in, increment the task counter
 * When a request finishes, decrement the task counter
 * In this way, you cannot have more than maxConcurrentTasks requests running at the same time
 */
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