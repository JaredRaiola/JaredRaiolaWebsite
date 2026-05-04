const COLORS = [
  '#000000',
  '#7f7f7f',
  '#7f0000',
  '#7f7f00',
  '#007f00',
  '#007f7f',
  '#00007f',
  '#7f007f',
  '#7f7f3f',
  '#003f3f',
  '#003f7f',
  '#3f007f',
  '#7f3f00',
  '#3f0000',
  '#ffffff',
  '#bfbfbf',
  '#ff0000',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#0000ff',
  '#ff00ff',
  '#ffff7f',
  '#00ff7f',
  '#00ffbf',
  '#7fbfff',
  '#bf7fff',
  '#ff7f7f',
];

type Props = {
  fg: string;
  bg: string;
  onSetFg(c: string): void;
  onSetBg(c: string): void;
};

export function Palette({ fg, bg, onSetFg, onSetBg }: Props) {
  return (
    <div className="paint-palette">
      <div className="paint-fg-bg">
        <div className="paint-color-bg" style={{ background: bg }} />
        <div className="paint-color-fg" style={{ background: fg }} />
      </div>
      <div className="paint-swatches">
        {COLORS.map((c) => (
          <button
            key={c}
            className="paint-swatch"
            style={{ background: c }}
            onClick={() => onSetFg(c)}
            onContextMenu={(e) => {
              e.preventDefault();
              onSetBg(c);
            }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}
