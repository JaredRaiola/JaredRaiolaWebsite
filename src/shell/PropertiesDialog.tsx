import { useEffect, useRef, useState } from 'react';
import {
  _setPropertiesSubscriber,
  computeFolderStats,
  fileTypeFromExt,
  formatBytes,
  type PropertiesArgs,
} from '@/lib/properties';
import { parent } from '@/core/fs/paths';
import './PropertiesDialog.css';

type Pending = PropertiesArgs & { resolve: () => void };

export function PropertiesDialogHost() {
  const [pending, setPending] = useState<Pending | null>(null);
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    _setPropertiesSubscriber((args, resolve) => setPending({ ...args, resolve }));
    return () => _setPropertiesSubscriber(null);
  }, []);

  useEffect(() => {
    if (pending) okRef.current?.focus();
  }, [pending]);

  if (!pending) return null;

  const { node, path, fs } = pending;
  const close = (): void => { pending.resolve(); setPending(null); };
  const isFile = node.kind === 'file';
  const stats = !isFile ? computeFolderStats(fs, path) : null;
  const location = parent(path) ?? '';
  const type = isFile ? fileTypeFromExt(node.name) : 'File Folder';

  return (
    <div className="propd-overlay" onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } }}>
      <div className="propd-dialog" role="dialog" aria-modal="true">
        <div className="propd-titlebar">
          <span className="propd-title">{node.name} Properties</span>
          <button className="propd-x" onClick={close} aria-label="Close">×</button>
        </div>
        <div className="propd-tabs">
          <button className="propd-tab propd-tab-active">General</button>
        </div>
        <div className="propd-body">
          <div className="propd-header">
            <strong className="propd-name">{node.name}</strong>
          </div>
          <div className="propd-row"><span className="propd-key">Type:</span><span>{type}</span></div>
          <div className="propd-row"><span className="propd-key">Location:</span><span>{location}</span></div>
          {isFile && (
            <div className="propd-row"><span className="propd-key">Size:</span><span>{formatBytes(node.size)}</span></div>
          )}
          {!isFile && stats && (
            <>
              <div className="propd-row"><span className="propd-key">Size:</span><span>{formatBytes(stats.size)}</span></div>
              <div className="propd-row"><span className="propd-key">Contains:</span><span>{stats.files} Files, {stats.folders} Folders</span></div>
            </>
          )}
          {!isFile && (
            <div className="propd-row"><span className="propd-key">Created:</span><span>{new Date(node.createdAt).toLocaleString()}</span></div>
          )}
          <div className="propd-row"><span className="propd-key">Modified:</span><span>{new Date(node.modifiedAt).toLocaleString()}</span></div>
        </div>
        <div className="propd-buttons">
          <button ref={okRef} onClick={close}>OK</button>
          <button onClick={close}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
