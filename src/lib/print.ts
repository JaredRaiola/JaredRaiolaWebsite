export function printText(text: string, title: string): void {
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    document.body.removeChild(frame);
    return;
  }

  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const safeTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  doc.open();
  doc.write(`<!doctype html><html><head><title>${safeTitle}</title>
<style>
  @page { margin: 0.5in; }
  body { font: 11pt 'Lucida Console', 'Courier New', monospace; white-space: pre-wrap; word-break: break-word; }
</style>
</head><body>${escaped}</body></html>`);
  doc.close();

  const cleanup = (): void => {
    if (frame.parentNode) frame.parentNode.removeChild(frame);
  };

  const fire = (): void => {
    win.focus();
    win.print();
    setTimeout(cleanup, 1000);
  };

  if (doc.readyState === 'complete') fire();
  else win.addEventListener('load', fire, { once: true });
}

export function printImage(dataUrl: string, title: string): void {
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    document.body.removeChild(frame);
    return;
  }

  const safeTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  doc.open();
  doc.write(`<!doctype html><html><head><title>${safeTitle}</title>
<style>
  @page { margin: 0.5in; }
  html, body { margin: 0; padding: 0; }
  img { display: block; max-width: 100%; height: auto; image-rendering: pixelated; }
</style>
</head><body><img src="${dataUrl}" alt=""></body></html>`);
  doc.close();

  const cleanup = (): void => {
    if (frame.parentNode) frame.parentNode.removeChild(frame);
  };

  const fire = (): void => {
    const img = doc.querySelector('img');
    const go = () => {
      win.focus();
      win.print();
      setTimeout(cleanup, 1000);
    };
    if (img && !img.complete) img.addEventListener('load', go, { once: true });
    else go();
  };

  if (doc.readyState === 'complete') fire();
  else win.addEventListener('load', fire, { once: true });
}
