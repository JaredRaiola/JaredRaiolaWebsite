import { useEffect, useState } from 'react';
import './BootScreen.css';

type Stage = 'floppy' | 'bios' | 'config' | 'splash';

const STAGE_ORDER: Stage[] = ['floppy', 'bios', 'config', 'splash'];

const STAGE_DURATIONS: Record<Stage, number> = {
  floppy: 3000,
  bios: 4000,
  config: 2500,
  splash: 2500,
};

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<Stage>('floppy');
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const idx = STAGE_ORDER.indexOf(stage);
      if (idx < STAGE_ORDER.length - 1) {
        setStage(STAGE_ORDER[idx + 1]);
      } else {
        setHide(true);
        setTimeout(onDone, 400);
      }
    }, STAGE_DURATIONS[stage]);
    return () => clearTimeout(t);
  }, [stage, onDone]);

  return (
    <div className={`boot-root ${hide ? 'fading' : ''}`}>
      {stage === 'floppy' && <FloppyStage />}
      {stage === 'bios' && <BiosStage />}
      {stage === 'config' && <ConfigStage />}
      {stage === 'splash' && <SplashStage />}
    </div>
  );
}

function FloppyStage() {
  return (
    <div className="boot-floppy-stage">
      <div className="boot-floppy-scene">
        {/* Tower */}
        <svg
          className="boot-tower"
          viewBox="0 0 44 64"
          shapeRendering="crispEdges"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0" y="0" width="44" height="64" fill="#d8d4c0" />
          <rect x="0" y="0" width="44" height="2" fill="#fff" />
          <rect x="0" y="0" width="2" height="64" fill="#fff" />
          <rect x="42" y="0" width="2" height="64" fill="#807868" />
          <rect x="0" y="62" width="44" height="2" fill="#807868" />
          <rect x="4" y="4" width="36" height="56" fill="#c8c4b0" />
          <rect x="4" y="4" width="36" height="1" fill="#807868" />
          <rect x="4" y="4" width="1" height="56" fill="#807868" />
          <rect x="39" y="4" width="1" height="56" fill="#fff" />
          <rect x="4" y="59" width="36" height="1" fill="#fff" />
          {/* CD-ROM tray */}
          <rect x="8" y="10" width="28" height="6" fill="#3a3a3a" />
          <rect x="9" y="11" width="26" height="1" fill="#1a1a1a" />
          <rect x="32" y="13" width="2" height="2" fill="#888" />
          {/* floppy slot */}
          <rect x="8" y="22" width="28" height="4" fill="#1a1a1a" />
          <rect x="9" y="23" width="26" height="2" fill="#000" />
          <rect x="32" y="24" width="2" height="1" fill="#666" />
          {/* power LED */}
          <rect x="34" y="48" width="2" height="2" fill="#5cff5c" />
          {/* power button */}
          <rect x="26" y="48" width="6" height="3" fill="#a8a494" />
          <rect x="26" y="48" width="6" height="1" fill="#fff" />
        </svg>
        {/* Floppy disk */}
        <svg
          className="boot-floppy"
          viewBox="0 0 34 32"
          shapeRendering="crispEdges"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0" y="0" width="34" height="32" fill="#202020" />
          <rect x="0" y="0" width="34" height="1" fill="#404040" />
          <rect x="33" y="0" width="1" height="32" fill="#000" />
          <rect x="0" y="31" width="34" height="1" fill="#000" />
          {/* metal shutter */}
          <rect x="6" y="0" width="20" height="11" fill="#bdbdbd" />
          <rect x="6" y="0" width="20" height="1" fill="#fff" />
          <rect x="6" y="0" width="1" height="11" fill="#fff" />
          <rect x="25" y="0" width="1" height="11" fill="#7a7a7a" />
          {/* shutter notch */}
          <rect x="13" y="3" width="6" height="6" fill="#5a5a5a" />
          <rect x="13" y="3" width="6" height="1" fill="#3a3a3a" />
          <rect x="13" y="3" width="1" height="6" fill="#3a3a3a" />
          {/* label */}
          <rect x="3" y="14" width="28" height="14" fill="#e8e4c8" />
          <rect x="3" y="14" width="28" height="1" fill="#fff" />
          <rect x="3" y="14" width="1" height="14" fill="#fff" />
          <rect x="30" y="14" width="1" height="14" fill="#a8a484" />
          <rect x="3" y="27" width="28" height="1" fill="#a8a484" />
          <rect x="6" y="17" width="22" height="1" fill="#000" />
          <rect x="6" y="20" width="18" height="1" fill="#404040" />
          <rect x="6" y="23" width="14" height="1" fill="#404040" />
        </svg>
      </div>
      <div className="boot-floppy-caption">Inserting boot disk...</div>
    </div>
  );
}

function BiosStage() {
  return (
    <div className="boot-bios">
      <pre className="boot-bios-text">
        <span className="boot-bios-line boot-bios-l1">
          <span className="boot-bios-orb">█</span> Award Modular BIOS v4.50PG, An Energy Star Ally
        </span>
        <span className="boot-bios-line boot-bios-l2">  Copyright (C) 1984-95, Award Software, Inc.</span>
        {'\n\n'}
        <span className="boot-bios-line boot-bios-l3">Version 3.03E704</span>
        {'\n\n'}
        <span className="boot-bios-line boot-bios-l4">PENTIUM-S CPU at 100MHz</span>
        <span className="boot-bios-line boot-bios-l5">Memory Test :  16384K OK</span>
        {'\n\n'}
        <span className="boot-bios-line boot-bios-l6">Award Plug and Play BIOS Extension v1.0A</span>
        <span className="boot-bios-line boot-bios-l7">Copyright (C) 1995, Award Software, Inc.</span>
        <span className="boot-bios-line boot-bios-l8">  Detecting HDD Primary Master  ... WDC AC34300L</span>
        <span className="boot-bios-line boot-bios-l9">  Detecting HDD Primary Slave   ... [Press F4 to skip]</span>
        <span className="boot-bios-line boot-bios-l10">  Detecting HDD Secondary Slave   ... [Press F4 to skip]</span>
        {'\n\n'}
        <span className="boot-bios-line boot-bios-l11">Initializing Plug and Play Cards...</span>
        <span className="boot-bios-line boot-bios-l12">
          Card-01 Creative SB16 PnP<span className="boot-bios-cursor">_</span>
        </span>
      </pre>
    </div>
  );
}

function ConfigStage() {
  const top: Array<[string, string, string, string]> = [
    ['CPU Type', ': PENTIUM-S', 'Base Memory', ': 640K'],
    ['Co-Processor', ': Installed', 'Extended Memory', ': 15360K'],
    ['CPU Clock', ': 100MHz', 'Cache Memory', ': 256K'],
  ];
  const bot: Array<[string, string, string, string]> = [
    ['Diskette Drive A', ': 1.44M, 3.5 in.', 'Display Type', ': EGA/VGA'],
    ['Diskette Drive B', ': 1.2M, 5.25 in.', 'Serial Port(s)', ': 3F8 2F8'],
    ['Pri. Master Disk', ': LBA, Mode 4, 4304MB', 'Parallel Port(s)', ': 378 278'],
    ['Pri. Slave  Disk', ': None', 'Bank0 EDO DRAM', ': Yes'],
    ['Sec. Master Disk', ': None', 'Bank1 EDO DRAM', ': No'],
    ['Sec. Slave  Disk', ': None', 'L2 Cache SRAM', ': Pipeline'],
  ];
  const fmt = (r: [string, string, string, string]): string =>
    ' │ ' + r[0].padEnd(17) + r[1].padEnd(22) + r[2].padEnd(18) + r[3].padEnd(13) + '│';
  return (
    <div className="boot-bios">
      <pre className="boot-bios-text">
        <span className="boot-cfg-line" style={{ animationDelay: '0s' }}>{'                       Award Software, Inc.'}</span>
        <span className="boot-cfg-line" style={{ animationDelay: '0.1s' }}>{'                       System Configurations'}</span>
        <span className="boot-cfg-line" style={{ animationDelay: '0.2s' }}>{' ┌──────────────────────────────────────────────────────────────────┐'}</span>
        {top.map((r, i) => (
          <span key={`t${i}`} className="boot-cfg-line" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
            {fmt(r)}
          </span>
        ))}
        <span className="boot-cfg-line" style={{ animationDelay: `${0.3 + top.length * 0.08}s` }}>
          {' ├──────────────────────────────────────────────────────────────────┤'}
        </span>
        {bot.map((r, i) => (
          <span key={`b${i}`} className="boot-cfg-line" style={{ animationDelay: `${0.4 + (top.length + i) * 0.08}s` }}>
            {fmt(r)}
          </span>
        ))}
        <span className="boot-cfg-line" style={{ animationDelay: `${0.4 + (top.length + bot.length) * 0.08}s` }}>
          {' └──────────────────────────────────────────────────────────────────┘'}
        </span>
        {'\n'}
        <span className="boot-bios-starting" style={{ animationDelay: `${0.6 + (top.length + bot.length) * 0.08}s` }}>
          Starting Windows 95...<span className="boot-bios-cursor">_</span>
        </span>
      </pre>
    </div>
  );
}

function SplashStage() {
  return (
    <div className="boot-splash">
      <div className="boot-splash-clouds" />
      <div className="boot-splash-corner">Microsoft</div>
      <div className="boot-splash-content">
        <img src="/assets/win95-logo.svg" alt="" className="boot-splash-logo" />
        <div className="boot-splash-text">
          <div className="boot-splash-microsoft">Microsoft</div>
          <div className="boot-splash-windows">
            Windows<span className="boot-splash-95">95</span>
          </div>
        </div>
      </div>
    </div>
  );
}
