import { createPortal } from 'react-dom';

type Props = { onClose: () => void };

export default function AboutDialog({ onClose }: Props): React.ReactElement {
  return createPortal(
    <div className="ch-dialog-overlay" onClick={onClose}>
      <div className="ch-dialog window" onClick={(e) => e.stopPropagation()}>
        <div className="title-bar"><div className="title-bar-text">About Chess</div></div>
        <div className="window-body ch-dialog-body">
          <p>Win95 Chess. Built for jaredraiola.com.</p>
        </div>
        <div className="ch-dialog-buttons"><button onClick={onClose}>OK</button></div>
      </div>
    </div>,
    document.body,
  );
}
