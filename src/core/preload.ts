import { listApps } from './apps/registry';
import { useDesktopStore } from '@/stores/desktopStore';

// Common icon assets that aren't necessarily on the desktop at boot but show
// up the moment any app/menu opens — preloading them keeps Explorer/Notepad
// from flashing missing-image placeholders on first open.
const COMMON_ICON_ASSETS = [
  // Generic file/folder icons
  '/assets/win98/png/computer-0.png',
  '/assets/win98/png/recycle_bin_empty-0.png',
  '/assets/win98/png/recycle_bin_full-0.png',
  '/assets/win98/png/directory_closed-0.png',
  '/assets/win98/png/directory_open-0.png',
  '/assets/win98/png/directory_open_file_mydocs-0.png',
  '/assets/win98/png/notepad-0.png',
  '/assets/win98/png/html-0.png',
  '/assets/win98/png/document-0.png',
  '/assets/win98/png/file_lines-0.png',
  '/assets/win98/png/file_program_group-0.png',
  '/assets/win98/png/settings_gear-0.png',
  '/assets/win98/png/search_file-0.png',
  '/assets/win98/png/help_book_big-0.png',
  '/assets/win98/png/application_hourglass-0.png',
  '/assets/win98/png/shut_down_normal-0.png',
  '/assets/win98/png/start_icon.png',
  // Social / profile icons
  '/assets/misc/github.png',
  '/assets/misc/linkedin.png',
  // System dialog icons
  '/assets/win98/png/msg_information-0.png',
  '/assets/win98/png/msg_error-0.png',
  '/assets/win98/png/msg_warning-0.png',
  '/assets/win98/png/msg_question-0.png',
  // Boot / shutdown / wallpapers — anything the shell renders without the
  // user opening an app first.
  '/assets/win95-logo.svg',
  '/assets/wallpapers/clouds.png',
  '/assets/wallpapers/setup.png',
];

const preloadedImages: HTMLImageElement[] = [];

function preloadImage(src: string): void {
  const img = new Image();
  img.src = src;
  // Hold a reference so the GC doesn't kill the in-flight request before the
  // image actually decodes into the browser cache.
  preloadedImages.push(img);
}

/**
 * Fire-and-forget preload of app code chunks and icon assets so the first
 * open of Notepad/Explorer (and the first render of any icon) doesn't have
 * to wait on a network round-trip.
 */
export function preload(): void {
  // 1. Kick off every registered app's dynamic import. The result is cached
  //    by Vite/the bundler, so React.lazy will resolve synchronously when
  //    the user actually opens the app.
  for (const app of listApps()) {
    void app.component().catch(() => {
      // ignore — the real open path will surface the error if it persists.
    });
  }

  // 2. Preload visible desktop icons + common icon assets + every registered
  //    app's icon (so the Start menu's Programs/Accessories/Games submenus
  //    don't flash missing-image placeholders on first hover). <img>s inside
  //    React components share the browser image cache, so subsequent renders
  //    are instant.
  const seen = new Set<string>();
  for (const url of COMMON_ICON_ASSETS) {
    if (!seen.has(url)) {
      seen.add(url);
      preloadImage(url);
    }
  }
  for (const app of listApps()) {
    if (!seen.has(app.icon)) {
      seen.add(app.icon);
      preloadImage(app.icon);
    }
  }
  for (const icon of Object.values(useDesktopStore.getState().icons)) {
    if (!seen.has(icon.iconUrl)) {
      seen.add(icon.iconUrl);
      preloadImage(icon.iconUrl);
    }
  }
}
