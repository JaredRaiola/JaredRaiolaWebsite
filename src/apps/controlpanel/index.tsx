import { useEffect, useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { useThemeStore } from '@/stores/themeStore';
import { DisplayTab } from './display';
import './controlpanel.css';

type Tab = 'display' | 'sounds' | 'datetime';

type ControlPanelSnapshot = { tab: Tab };

export default function ControlPanel({ api, args, restoreState }: AppProps) {
  const restored = (restoreState as Partial<ControlPanelSnapshot> | undefined);
  const initialTab =
    restored?.tab ??
    ((args as { tab?: Tab } | undefined)?.tab ?? 'display');
  const [tab, setTab] = useState<Tab>(initialTab as Tab);

  useEffect(() => {
    return api.registerSnapshot((): ControlPanelSnapshot => ({ tab }));
  }, [tab, api]);

  const initialDraft = {
    wallpaperKey: useThemeStore.getState().wallpaperKey as string,
    wallpaperMode: useThemeStore.getState().wallpaperMode,
    bgColor: useThemeStore.getState().bgColor,
  };

  const apply = (d: typeof initialDraft): void => {
    useThemeStore.getState().setWallpaper(d.wallpaperKey as never);
    useThemeStore.getState().setWallpaperMode(d.wallpaperMode);
    useThemeStore.getState().setBgColor(d.bgColor);
  };

  return (
    <div className="cp-root">
      <div className="cp-tabs">
        <button
          className={tab === 'display' ? 'cp-tab cp-tab-active' : 'cp-tab'}
          onClick={() => setTab('display')}
        >Display</button>
        <button className="cp-tab cp-tab-disabled" disabled>Sounds</button>
        <button className="cp-tab cp-tab-disabled" disabled>Date/Time</button>
      </div>
      <div className="cp-tab-content">
        {tab === 'display' && (
          <DisplayTab
            initial={initialDraft}
            onApply={apply}
            onOk={(d) => { apply(d); api.requestClose(); }}
            onCancel={() => api.requestClose()}
          />
        )}
      </div>
    </div>
  );
}
