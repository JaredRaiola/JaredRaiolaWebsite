import { useDialogStore, type DialogIcon } from '@/stores/dialogStore';

type AlertOpts = { title?: string; icon?: DialogIcon; okLabel?: string };
type ConfirmOpts = {
  title?: string;
  icon?: DialogIcon;
  okLabel?: string;
  cancelLabel?: string;
};
type PromptOpts = {
  title?: string;
  icon?: DialogIcon;
  okLabel?: string;
  cancelLabel?: string;
};

/** Win95-style replacement for window.alert. Resolves when the user clicks OK. */
export function sysAlert(message: string, opts: AlertOpts = {}): Promise<void> {
  return new Promise<void>((resolve) => {
    useDialogStore.getState().push({
      kind: 'alert',
      title: opts.title ?? 'Notice',
      message,
      icon: opts.icon ?? 'info',
      okLabel: opts.okLabel ?? 'OK',
      resolve: () => resolve(),
    });
  });
}

/** Win95-style replacement for window.confirm. Resolves true on OK/Yes, false otherwise. */
export function sysConfirm(message: string, opts: ConfirmOpts = {}): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    useDialogStore.getState().push({
      kind: 'confirm',
      title: opts.title ?? 'Confirm',
      message,
      icon: opts.icon ?? 'question',
      okLabel: opts.okLabel ?? 'Yes',
      cancelLabel: opts.cancelLabel ?? 'No',
      resolve: (v) => resolve(v === true),
    });
  });
}

/** Win95-style replacement for window.prompt. Resolves with the entered string, or null on cancel. */
export function sysPrompt(
  message: string,
  defaultValue = '',
  opts: PromptOpts = {},
): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    useDialogStore.getState().push({
      kind: 'prompt',
      title: opts.title ?? 'Input',
      message,
      icon: opts.icon ?? 'question',
      defaultValue,
      okLabel: opts.okLabel ?? 'OK',
      cancelLabel: opts.cancelLabel ?? 'Cancel',
      resolve: (v) => (typeof v === 'string' ? resolve(v) : resolve(null)),
    });
  });
}
