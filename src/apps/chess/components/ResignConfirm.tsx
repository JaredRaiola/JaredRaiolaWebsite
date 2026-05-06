import { useDialogDrag } from '@/lib/useDialogDrag';

type Props = { onYes: () => void; onNo: () => void };

export default function ResignConfirm({ onYes, onNo }: Props): React.ReactElement {
  const drag = useDialogDrag();
  return (
    <div className="ch-dialog-overlay" onClick={onNo}>
      <div className="ch-dialog window" onClick={(e) => e.stopPropagation()} style={{ transform: drag.transform }}>
        <div className="title-bar" onPointerDown={drag.onPointerDown}><div className="title-bar-text">Resign</div></div>
        <div className="window-body ch-dialog-body"><p>Resign this game?</p></div>
        <div className="ch-dialog-buttons">
          <button onClick={onYes}>Yes</button>
          <button onClick={onNo}>No</button>
        </div>
      </div>
    </div>
  );
}
