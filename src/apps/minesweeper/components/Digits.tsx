import { DigitSpriteSvg } from '../sprites';

type Props = { value: number };

/** Three-digit LED display; clamps to -99..999, renders leading "-" or "0" pads. */
export function Digits({ value }: Props) {
  let chars: (number | '-')[];
  if (value < 0) {
    const abs = Math.min(99, -value);
    chars = ['-', Math.floor(abs / 10), abs % 10];
  } else {
    const v = Math.min(999, value);
    chars = [Math.floor(v / 100), Math.floor((v / 10) % 10), v % 10];
  }
  return (
    <div className="ms-digits">
      {chars.map((c, i) => <DigitSpriteSvg key={i} value={c} />)}
    </div>
  );
}
