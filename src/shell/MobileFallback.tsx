export function MobileFallback() {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#008080',
          padding: 20,
          color: 'white',
          fontFamily: 'MS Sans Serif, sans-serif',
          overflowY: 'auto',
        }}
      >
        <div className="window" style={{ background: '#c0c0c0', color: 'black', maxWidth: 360, margin: '0 auto 16px' }}>
          <div className="title-bar">
            <div className="title-bar-text">Notice</div>
          </div>
          <div className="window-body">
            <p>This site is best viewed on a desktop browser.</p>
            <p>Below is a quick "About Me" while you're here.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => document.getElementById('mob-info')?.scrollIntoView()}>OK</button>
            </div>
          </div>
        </div>

        <div id="mob-info" style={{ maxWidth: 480, margin: '0 auto', lineHeight: 1.5 }}>
          <h2 style={{ marginTop: 0 }}>Jared Raiola</h2>
          <p>Software engineer. This site is normally a Windows 95 facsimile — pop it open on a desktop to play.</p>
          <p>
            <a style={{ color: 'white' }} href="https://github.com/JaredRaiola">GitHub</a>{' · '}
            <a style={{ color: 'white' }} href="https://www.linkedin.com/in/jared-raiola/">LinkedIn</a>
          </p>
        </div>
      </div>
    </>
  );
}
