export class History {
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];
  constructor(private capacity: number) {}

  push(snapshot: ImageData): void {
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.capacity) this.undoStack.shift();
    this.redoStack = [];
  }

  undo(): ImageData | null {
    if (this.undoStack.length <= 1) return null;
    const cur = this.undoStack.pop()!;
    this.redoStack.push(cur);
    return this.undoStack[this.undoStack.length - 1] ?? null;
  }

  redo(): ImageData | null {
    const next = this.redoStack.pop();
    if (!next) return null;
    this.undoStack.push(next);
    return next;
  }

  reset(initial: ImageData): void {
    this.undoStack = [initial];
    this.redoStack = [];
  }

  current(): ImageData | null {
    return this.undoStack[this.undoStack.length - 1] ?? null;
  }
}
