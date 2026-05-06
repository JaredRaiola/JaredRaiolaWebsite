import { Digits } from './Digits';
import { Face } from './Face';
import type { FaceSprite } from '../sprites';

type Props = {
  minesRemaining: number;
  elapsedSeconds: number;
  faceState: FaceSprite;
  onFaceClick(): void;
};

export function Header(p: Props) {
  return (
    <div className="ms-header">
      <div className="ms-led"><Digits value={p.minesRemaining} /></div>
      <Face state={p.faceState} onClick={p.onFaceClick} />
      <div className="ms-led"><Digits value={p.elapsedSeconds} /></div>
    </div>
  );
}
