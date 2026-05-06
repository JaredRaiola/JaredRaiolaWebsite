import { useState } from 'react';
import { FaceSpriteSvg, type FaceSprite } from '../sprites';

type Props = {
  state: FaceSprite;
  onClick(): void;
};

export function Face({ state, onClick }: Props) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      className={`ms-face${pressed ? ' pressed' : ''}`}
      onPointerDown={(e) => { e.preventDefault(); setPressed(true); }}
      onPointerUp={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const inside =
          e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top && e.clientY <= r.bottom;
        setPressed(false);
        if (inside) onClick();
      }}
      onPointerLeave={() => setPressed(false)}
    >
      <FaceSpriteSvg state={state} />
    </button>
  );
}
