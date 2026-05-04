export type RestoreConflictResolution = 'replace' | 'rename' | 'cancel';
export type RestoreConflictResult = {
  resolution: RestoreConflictResolution;
  applyToAll: boolean;
};

type Subscriber = (
  args: { binName: string; originPath: string; multi: boolean },
  resolve: (r: RestoreConflictResult) => void,
) => void;

let subscriber: Subscriber | null = null;
export function _setRestoreConflictSubscriber(fn: Subscriber | null): void {
  subscriber = fn;
}

export function showRestoreConflict(args: {
  binName: string;
  originPath: string;
  multi: boolean;
}): Promise<RestoreConflictResult> {
  return new Promise((resolve) => {
    if (!subscriber) {
      resolve({ resolution: 'cancel', applyToAll: false });
      return;
    }
    subscriber(args, resolve);
  });
}
