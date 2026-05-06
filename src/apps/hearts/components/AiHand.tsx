import CardBackSvg from '@/apps/solitaire/cards/CardBackSvg';

type Props = {
  count: number;
  orientation: 'horizontal' | 'vertical';
  name: string;
  highlighted?: boolean;
};

const STRIDE = 14;

export default function AiHand({ count, orientation, name, highlighted }: Props): React.ReactElement {
  const span = count > 0 ? STRIDE * (count - 1) + 71 : 0;
  return (
    <div className={`hearts-ai${orientation === 'vertical' ? ' vertical' : ''}${highlighted ? ' highlighted' : ''}`}>
      <div className="hearts-ai-label">{name} ({count})</div>
      <div className="hearts-ai-fan" style={orientation === 'vertical' ? { height: span } : { width: span }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="hearts-ai-card" style={orientation === 'vertical' ? { top: i * STRIDE } : { left: i * STRIDE }}>
            <CardBackSvg />
          </div>
        ))}
      </div>
    </div>
  );
}
