import { useState } from 'react';
import { wallpaperUrl, type WallpaperMode } from '@/stores/themeStore';
import { COLOR_SCHEMES, findSchemeByBg } from './palette';
import { WALLPAPER_OPTIONS } from './wallpapers';

type Draft = {
  wallpaperKey: string;
  wallpaperMode: WallpaperMode;
  bgColor: string;
};

type Props = {
  initial: Draft;
  onApply(d: Draft): void;
  onOk(d: Draft): void;
  onCancel(): void;
};

export function DisplayTab({ initial, onApply, onOk, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(initial);
  const previewWallpaper = wallpaperUrl(draft.wallpaperKey as never);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="cp-display">
      <div className="cp-section cp-preview-section">
        <div
          className="cp-preview"
          style={{
            backgroundColor: draft.bgColor,
            backgroundImage: previewWallpaper ? `url(${previewWallpaper})` : undefined,
            backgroundRepeat: draft.wallpaperMode === 'tile' ? 'repeat' : 'no-repeat',
            backgroundSize: draft.wallpaperMode === 'stretch' ? '100% 100%' : 'auto',
            backgroundPosition: 'center',
          }}
        />
      </div>

      <div className="cp-section">
        <label className="cp-label">Wallpaper</label>
        <select
          size={5}
          value={draft.wallpaperKey}
          onChange={(e) => set('wallpaperKey', e.target.value)}
          className="cp-list"
        >
          {WALLPAPER_OPTIONS.map((w) => (
            <option key={w.key} value={w.key}>{w.label}</option>
          ))}
        </select>
        <div className="cp-row">
          <label className="cp-label">Display</label>
          <select
            value={draft.wallpaperMode}
            onChange={(e) => set('wallpaperMode', e.target.value as WallpaperMode)}
          >
            <option value="tile">Tile</option>
            <option value="center">Center</option>
            <option value="stretch">Stretch</option>
          </select>
        </div>
      </div>

      <div className="cp-section">
        <label className="cp-label">Color Scheme</label>
        <select
          value={findSchemeByBg(draft.bgColor)?.key ?? ''}
          onChange={(e) => {
            const next = COLOR_SCHEMES.find((s) => s.key === e.target.value);
            if (next) set('bgColor', next.bg);
          }}
        >
          {findSchemeByBg(draft.bgColor) ? null : <option value="">Custom</option>}
          {COLOR_SCHEMES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="cp-buttons">
        <button onClick={() => onOk(draft)}>OK</button>
        <button onClick={onCancel}>Cancel</button>
        <button onClick={() => onApply(draft)}>Apply</button>
      </div>
    </div>
  );
}

