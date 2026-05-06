export default function CardBackSvg(): React.ReactElement {
  return (
    <svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" className="card-back">
      <rect width="100" height="140" rx="6" ry="6" fill="#3a4ad6" stroke="#000" strokeWidth="1" />
      <rect x="4" y="4" width="92" height="132" rx="4" ry="4" fill="none" stroke="#fff" strokeWidth="1" />
      <g stroke="#fff" strokeWidth="0.6" opacity="0.6">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`h${i}`} x1="6" y1={10 + i * 11} x2="94" y2={10 + i * 11} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`v${i}`} x1={10 + i * 11} y1="6" x2={10 + i * 11} y2="134" />
        ))}
      </g>
    </svg>
  );
}
