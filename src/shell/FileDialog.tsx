import { useState } from 'react';
import { useFsStore } from '@/stores/fsStore';
import { join, parent } from '@/core/fs/paths';
import './FileDialog.css';

type Props = {
  mode: 'open' | 'save';
  initialPath?: string;
  defaultFileName?: string;
  filterExt?: string[];
  onSubmit(path: string): void;
  onCancel(): void;
};

export function FileDialog({ mode, initialPath = 'C:\\My Documents', defaultFileName = '', filterExt, onSubmit, onCancel }: Props) {
  const fs = useFsStore((s) => s.fs);
  const [cwd, setCwd] = useState(initialPath);
  const [name, setName] = useState(defaultFileName);
  const [selected, setSelected] = useState<string | null>(null);

  if (!fs) return null;
  const items = fs.list(cwd).filter((n) => {
    if (n.kind === 'dir') return true;
    if (!filterExt) return true;
    return filterExt.some((e) => n.name.toLowerCase().endsWith(e.toLowerCase()));
  });

  const goUp = (): void => {
    const p = parent(cwd);
    if (p) setCwd(p);
  };

  const submit = (): void => {
    if (!name.trim()) return;
    onSubmit(join(cwd, name));
  };

  return (
    <div className="window" style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', zIndex: 99500 }}>
      <div className="title-bar">
        <div className="title-bar-text">{mode === 'open' ? 'Open' : 'Save As'}</div>
        <div className="title-bar-controls">
          <button aria-label="Close" onClick={onCancel} />
        </div>
      </div>
      <div className="window-body fd-root">
        <div className="fd-toolbar">
          <label>Look in:</label>
          <input
            value={cwd}
            onChange={(e) => setCwd(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={goUp} title="Up one level">↑</button>
        </div>
        <div className="fd-list">
          {items.map((node) => (
            <div
              key={node.name}
              className={`fd-row ${selected === node.name ? 'selected' : ''}`}
              onClick={() => {
                setSelected(node.name);
                if (node.kind === 'file') setName(node.name);
              }}
              onDoubleClick={() => {
                if (node.kind === 'dir') setCwd(join(cwd, node.name));
                else {
                  setName(node.name);
                  onSubmit(join(cwd, node.name));
                }
              }}
            >
              <img src={node.kind === 'dir' ? '/assets/win98/png/directory_closed-0.png' : '/assets/win98/png/notepad-0.png'} alt="" />
              {node.name}
            </div>
          ))}
        </div>
        <div className="fd-bottom">
          <label>{mode === 'open' ? 'File name:' : 'Save as:'}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <button onClick={submit}>{mode === 'open' ? 'Open' : 'Save'}</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
