import { pieceTips } from '../../../entities/game/lib/format';
import { PieceIcon } from '../../../entities/game/ui/PieceIcon';
import { Modal } from '../../../shared/ui/Modal';

export function PieceHelpModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): JSX.Element {
  return (
    <Modal open={open} title="Как ходят фигуры" className="rules-modal" onClose={onClose}>
      <button
        className="modal-close"
        type="button"
        onClick={onClose}
        aria-label="Закрыть подсказки"
      >
        ×
      </button>
      <div className="piece-tips">
        {pieceTips.map((tip) => (
          <article className="piece-tip" key={tip.type}>
            <PieceIcon color="white" type={tip.type} className="tip-piece" />
            <div>
              <strong>{tip.title}</strong>
              <p>{tip.description}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="piece-attribution">
        Фигуры:{' '}
        <a href="/pieces/cburnett/NOTICE.md" target="_blank" rel="noreferrer">
          Colin M. L. Burnett · GPL-2.0+
        </a>
      </p>
    </Modal>
  );
}
