import { useRef, useState } from 'react';
import { wallpaperUrl, useThemeStore, type WallpaperMode } from '@/stores/themeStore';
import { sysAlert, sysConfirm } from '@/lib/dialog';
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

const MAX_DIM = 1920;
const MAX_BYTES = 2 * 1024 * 1024;

/** Read a File and resize it down to MAX_DIM along the longest edge. Returns
 *  a data URL (JPEG, quality 0.85). */
async function resizeImageToDataUrl(file: File): Promise<string> {
  const img = new Image();
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
  let { width, height } = img;
  const longest = Math.max(width, height);
  if (longest > MAX_DIM) {
    const scale = MAX_DIM / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export function DisplayTab({ initial, onApply, onOk, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(initial);
  const customWallpapers = useThemeStore((s) => s.customWallpapers);
  const addCustomWallpaper = useThemeStore((s) => s.addCustomWallpaper);
  const removeCustomWallpaper = useThemeStore((s) => s.removeCustomWallpaper);
  const fileRef = useRef<HTMLInputElement>(null);

  const previewWallpaper = wallpaperUrl(draft.wallpaperKey);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const onBrowse = (): void => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      void sysAlert('That file is not an image.', { title: 'Display', icon: 'error' });
      return;
    }
    // Defense-in-depth: reject SVG/XML uploads outright. Even though the
    // canvas re-encode below produces a raster JPEG (stripping any embedded
    // scripts), refusing the source is clearer intent and avoids browsers
    // running SVG scripts during the Image() decode step.
    if (file.type === 'image/svg+xml' || file.type.includes('xml')) {
      void sysAlert('SVG and XML images are not supported.', { title: 'Display', icon: 'error' });
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      if (dataUrl.length > MAX_BYTES) {
        void sysAlert('Image is too large to save (over 2MB after compression).', { title: 'Display', icon: 'error' });
        return;
      }
      const name = file.name.replace(/\.[^.]+$/, '');
      const newKey = addCustomWallpaper(name, dataUrl);
      set('wallpaperKey', newKey);
    } catch (err) {
      void sysAlert(`Could not load image: ${(err as Error).message}`, { title: 'Display', icon: 'error' });
    }
  };

  const onRemoveCustom = (): void => {
    if (!draft.wallpaperKey.startsWith('custom:')) return;
    const id = draft.wallpaperKey.slice('custom:'.length);
    const wp = customWallpapers.find((w) => w.id === id);
    if (!wp) return;
    void sysConfirm(`Remove the wallpaper "${wp.name}"?`, { title: 'Remove Wallpaper', icon: 'warn' }).then((ok) => {
      if (!ok) return;
      removeCustomWallpaper(id);
      set('wallpaperKey', 'teal');
    });
  };

  const isCustomSelected = draft.wallpaperKey.startsWith('custom:');

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
          size={6}
          value={draft.wallpaperKey}
          onChange={(e) => set('wallpaperKey', e.target.value)}
          className="cp-list"
        >
          {WALLPAPER_OPTIONS.map((w) => (
            <option key={w.key} value={w.key}>{w.label}</option>
          ))}
          {customWallpapers.length > 0 && (
            <optgroup label="My Wallpapers">
              {customWallpapers.map((w) => (
                <option key={w.id} value={`custom:${w.id}`}>{w.name}</option>
              ))}
            </optgroup>
          )}
        </select>
        <div className="cp-row" style={{ gap: 6 }}>
          <button onClick={onBrowse}>Browse...</button>
          <button onClick={onRemoveCustom} disabled={!isCustomSelected}>Remove</button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => { void onFileChange(e); }}
            style={{ display: 'none' }}
          />
        </div>
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
