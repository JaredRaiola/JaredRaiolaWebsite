// "Reset Computer": wipe all persisted user state (localStorage + sessionStorage
// keys we own, plus the IndexedDB filesystem) and reload so boot reseeds from
// scratch. Equivalent to opening DevTools and clearing site data, but
// scoped to our keys so we don't nuke unrelated origin storage.

const FS_DB_NAME = 'win95-fs';
const SESSION_DB_NAME = 'win95-session';
const RESETTING_DURATION_MS = 2500;

// Keys we keep across a reset. The first-boot flag drives the cute floppy
// intro — we only want it the very first time a person ever lands on the
// site, not after every reset.
const PRESERVED_KEYS = new Set<string>(['win95.firstBootSeen']);

export async function resetComputer(): Promise<void> {
  renderResettingScreen();
  // Hold the screen briefly so the user sees the reset is happening.
  await new Promise<void>((r) => setTimeout(r, RESETTING_DURATION_MS));

  // Drop every win95.* key in both storages, except preserved ones.
  const wipe = (storage: Storage) => {
    const toRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('win95.') && !PRESERVED_KEYS.has(key)) toRemove.push(key);
    }
    for (const k of toRemove) storage.removeItem(k);
  };
  try {
    wipe(localStorage);
  } catch {
    /* ignore */
  }
  try {
    wipe(sessionStorage);
  } catch {
    /* ignore */
  }

  // Drop the FS database. deleteDatabase blocks until other connections close,
  // so we wrap it in a promise that also resolves on `blocked` to keep the
  // user from getting stuck if a tab holds a stale connection.
  await new Promise<void>((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(FS_DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });

  await new Promise<void>((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(SESSION_DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });

  location.reload();
}

function renderResettingScreen(): void {
  document.body.innerHTML = `
    <div style="background:#008080;color:#fff;font-family:'MS Sans Serif','Microsoft Sans Serif',Tahoma,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;text-align:center;">
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 6px;">Resetting computer...</h1>
      <p style="margin:0 0 28px;font-size:13px;opacity:0.8;">Restoring original state. Please wait.</p>
      <div style="width:280px;height:20px;border:2px inset #c0c0c0;background:#000;padding:2px;box-sizing:border-box;">
        <div style="height:100%;background:#000080;width:0;animation:reset-bar ${RESETTING_DURATION_MS - 200}ms ease-out forwards;"></div>
      </div>
      <style>@keyframes reset-bar { from { width: 0; } to { width: 100%; } }</style>
    </div>
  `;
}
