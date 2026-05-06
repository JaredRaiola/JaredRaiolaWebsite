import { useEffect, useRef, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { FileDialog } from '@/shell/FileDialog';
import { basename } from '@/core/fs/paths';
import { useWindowStore } from '@/stores/windowStore';
import { useHotkeys } from '@/lib/useHotkeys';
import { printText } from '@/lib/print';
import './notepad.css';

const WRAP_KEY = 'notepad.wordWrap';

type Args = { path?: string };

type NotepadSnapshot = {
  text: string;
  path: string | null;
  dirty: boolean;
  wrap: boolean;
};

export default function Notepad({ api, fs, args, restoreState }: AppProps) {
  const initial = (args as Args | undefined) ?? {};
  const restored = (restoreState as Partial<NotepadSnapshot> | undefined);
  const [path, setPath] = useState<string | null>(restored?.path ?? initial.path ?? null);
  const [content, setContent] = useState(typeof restored?.text === 'string' ? restored.text : '');
  const [dirty, setDirty] = useState<boolean>(restored?.dirty ?? false);
  const [wrap, setWrap] = useState<boolean>(
    typeof restored?.wrap === 'boolean'
      ? restored.wrap
      : localStorage.getItem(WRAP_KEY) !== 'false',
  );
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<'open' | 'save' | null>(null);
  const pendingResolve = useRef<((b: boolean) => void) | null>(null);
  const focused = useWindowStore((s) => s.focusedId === api.windowId);

  useEffect(() => {
    // If restoring a session, the text/path/dirty are already in state.
    // Don't re-read from FS — that would clobber unsaved buffer changes.
    if (restored) return;
    if (initial.path) {
      void fs.readText(initial.path).then((text) => {
        setContent(text);
        setDirty(false);
        api.setTitle(`${basename(initial.path!)} - Notepad`);
      });
    } else {
      api.setTitle('Untitled - Notepad');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register session-snapshot getter.
  useEffect(() => {
    return api.registerSnapshot((): NotepadSnapshot => ({ text: content, path, dirty, wrap }));
  }, [content, path, dirty, wrap, api]);

  useEffect(() => {
    const title = (path ? basename(path) : 'Untitled') + (dirty ? ' *' : '') + ' - Notepad';
    api.setTitle(title);
  }, [path, dirty, api]);

  useEffect(() => {
    localStorage.setItem(WRAP_KEY, String(wrap));
  }, [wrap]);

  const print = (): void => {
    printText(content, path ? basename(path) : 'Untitled');
  };

  useHotkeys(
    {
      'ctrl+n': () => void newFile(),
      'ctrl+o': () => setDialogMode('open'),
      'ctrl+s': () => void save(),
      'ctrl+shift+s': () => void saveAs(),
      'ctrl+p': () => print(),
    },
    { enabled: focused },
  );

  const newFile = async (): Promise<void> => {
    if (dirty && !(await confirmDiscard())) return;
    setPath(null);
    setContent('');
    setDirty(false);
  };

  const save = async (): Promise<boolean> => {
    if (!path) return saveAs();
    await fs.writeText(path, content);
    setDirty(false);
    return true;
  };

  const saveAs = async (): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setDialogMode('save');
      pendingResolve.current = resolve;
    });
  };

  const confirmDiscard = async (): Promise<boolean> => {
    const r = await api.showDialog({
      title: 'Notepad',
      message: `Save changes to ${path ? basename(path) : 'Untitled'}?`,
      buttons: ['yes', 'no', 'cancel'],
      icon: 'question',
    });
    if (r === 'cancel') return false;
    if (r === 'yes') {
      const ok = await save();
      if (!ok) return false;
    }
    return true;
  };

  return (
    <div className="notepad-root" onClick={() => setOpenMenu(null)}>
      <div className="notepad-menubar">
        <Menu
          label="File"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          items={[
            { label: 'New', onSelect: newFile },
            { label: 'Open...', onSelect: () => setDialogMode('open') },
            { label: 'Save', onSelect: () => void save() },
            { label: 'Save As...', onSelect: () => void saveAs() },
            { kind: 'sep' },
            { label: 'Page Setup...', disabled: true },
            { label: 'Print...', onSelect: print },
            { kind: 'sep' },
            { label: 'Exit', onSelect: () => api.requestClose() },
          ]}
        />
        <Menu
          label="Edit"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          items={[
            { label: 'Undo', disabled: true },
            { kind: 'sep' },
            { label: 'Cut', disabled: true },
            { label: 'Copy', disabled: true },
            { label: 'Paste', disabled: true },
            { label: 'Delete', disabled: true },
          ]}
        />
        <Menu
          label="Format"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          items={[
            { label: `${wrap ? '✓ ' : ''}Word Wrap`, onSelect: () => setWrap((w) => !w) },
            { label: 'Font...', disabled: true },
          ]}
        />
        <Menu
          label="Help"
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          items={[{ label: 'About Notepad', disabled: true }]}
        />
      </div>
      <textarea
        className="notepad-area"
        value={content}
        wrap={wrap ? 'soft' : 'off'}
        onChange={(e) => {
          setContent(e.target.value);
          setDirty(true);
        }}
      />
      {dialogMode && (
        <FileDialog
          mode={dialogMode}
          initialPath={path ? path.replace(/\\[^\\]+$/, '') : 'C:\\Windows\\User\\Desktop\\My Documents'}
          defaultFileName={path ? basename(path) : ''}
          filterExt={['.txt']}
          onCancel={() => {
            setDialogMode(null);
            pendingResolve.current?.(false);
            pendingResolve.current = null;
          }}
          onSubmit={async (chosen) => {
            const ext = chosen.toLowerCase().endsWith('.txt') ? chosen : chosen + '.txt';
            if (dialogMode === 'open') {
              const text = await fs.readText(ext);
              setPath(ext);
              setContent(text);
              setDirty(false);
            } else {
              await fs.writeText(ext, content);
              setPath(ext);
              setDirty(false);
              pendingResolve.current?.(true);
              pendingResolve.current = null;
            }
            setDialogMode(null);
          }}
        />
      )}
    </div>
  );
}

type MenuItem =
  | { label: string; onSelect?: () => void; disabled?: boolean; kind?: undefined }
  | { kind: 'sep' };

function Menu({
  label,
  items,
  openMenu,
  setOpenMenu,
}: {
  label: string;
  items: MenuItem[];
  openMenu: string | null;
  setOpenMenu: (s: string | null) => void;
}) {
  const open = openMenu === label;
  return (
    <div
      className="notepad-menu"
      onClick={(e) => {
        e.stopPropagation();
        setOpenMenu(open ? null : label);
      }}
    >
      {label}
      {open && (
        <div className="notepad-menu-popup">
          {items.map((it, i) =>
            'kind' in it && it.kind === 'sep' ? (
              <div key={i} className="sep" />
            ) : (
              <div
                key={i}
                className={`item ${'disabled' in it && it.disabled ? 'disabled' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if ('disabled' in it && it.disabled) return;
                  if ('onSelect' in it) it.onSelect?.();
                  setOpenMenu(null);
                }}
              >
                <span>{(it as { label: string }).label}</span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
