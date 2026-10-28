import type { Color, Move } from '@chess/shared';
import { PieceIcon } from '../../../entities/game/ui/PieceIcon';
import { pieceNames } from '../../../entities/game/lib/format';
import { Modal } from '../../../shared/ui/Modal';

interface PromotionModalProps {
  moves: Move[] | null;
  color: Color;
  onSelect: (move: Move) => void;
  onCancel: () => void;
}

export function PromotionModal({
  moves,
  color,
  onSelect,
  onCancel,
}: PromotionModalProps): JSX.Element {
  return (
    <Modal
      open={Boolean(moves)}
      title="Выберите фигуру"
      className="promotion-modal"
      onClose={onCancel}
    >
      <div className="promotion-options">
        {moves?.map((move) => (
          <button key={move.promotion} onClick={() => onSelect(move)}>
            <PieceIcon color={color} type={move.promotion!} />
            <span>{pieceNames[move.promotion!]}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
