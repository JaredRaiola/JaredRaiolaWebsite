import { useState } from 'react';
import type { AppProps } from '@/core/apps/registry';
import { useThemeStore } from '@/stores/themeStore';
import { DisplayTab } from './display';
import './controlpanel.css';

type Tab = 'display' | 'sounds' | 'datetime';

export default function ControlPanel({ api, args }: AppProps) {
  const initialTab = ((args as { tab?: Tab } | undefined)?.tab ?? 'display') as Tab;
  const [tab, setTab] = useState<Tab>(initialTab);

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
