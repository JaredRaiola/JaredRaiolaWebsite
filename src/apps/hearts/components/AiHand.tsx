import CardBackSvg from '@/apps/solitaire/cards/CardBackSvg';

type Props = {
  count: number;
  orientation: 'top' | 'left' | 'right';
  name: string;
  highlighted?: boolean;
};

const STRIDE = 14;

export default function AiHand({ count, orientation, name, highlighted }: Props): React.ReactElement {
  const isVertical = orientation === 'left' || orientation === 'right';
  const span = count > 0 ? STRIDE * (count - 1) + 71 : 0;
  const label = <div className="hearts-ai-label">{name} ({count})</div>;
  const fan = (
    <div className="hearts-ai-fan" style={isVertical ? { height: span } : { width: span }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="hearts-ai-card" style={isVertical ? { top: i * STRIDE } : { left: i * STRIDE }}>
          <CardBackSvg />
        </div>
      ))}
    </div>
  );
  return (
    <div className={`hearts-ai hearts-ai-${orientation}${highlighted ? ' highlighted' : ''}`}>
      {orientation === 'top' && (
        <>
          {label}
          {fan}
        </>
      )}
      {orientation === 'left' && (
        <>
          {label}
          {fan}
        </>
      )}
      {orientation === 'right' && (
        <>
          {fan}
          {label}
        </>
      )}
    </div>
  );
}
