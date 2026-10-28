import {
  isInCheck,
  oppositeColor,
  squareName,
  type Color,
  type GameState,
  type MoveRecord,
  type PieceType,
  type RoomView,
} from '@chess/shared';

export const pieceNames: Record<PieceType, string> = {
  k: 'Король',
  q: 'Ферзь',
  r: 'Ладья',
  b: 'Слон',
  n: 'Конь',
  p: 'Пешка',
};

export const pieceTips: Array<{ type: PieceType; title: string; description: string }> = [
  { type: 'k', title: 'Король', description: 'На одну клетку в любую сторону.' },
  { type: 'q', title: 'Ферзь', description: 'По прямой и по диагонали на любое расстояние.' },
  { type: 'r', title: 'Ладья', description: 'По вертикали и горизонтали на любое расстояние.' },
  { type: 'b', title: 'Слон', description: 'По диагонали на любое расстояние.' },
  { type: 'n', title: 'Конь', description: 'Буквой «Г»: две клетки и одна в сторону.' },
  {
    type: 'p',
    title: 'Пешка',
    description: 'Вперёд, а бьёт по диагонали; с первой линии может пройти две клетки.',
  },
];

export const statusLabel = (state: GameState, you: Color): string => {
  if (state.status === 'checkmate')
    return state.winner === you ? 'Мат — вы победили' : 'Мат — победа соперника';
  if (state.status === 'stalemate') return 'Пат — ничья';
  if (state.status === 'draw') {
    const reasons = {
      agreement: 'Ничья по соглашению',
      'insufficient-material': 'Ничья — недостаточно материала',
      'threefold-repetition': 'Ничья — троекратное повторение',
      'fivefold-repetition': 'Ничья — пятикратное повторение',
      'fifty-move-rule': 'Ничья — правило 50 ходов',
      'seventy-five-move-rule': 'Ничья — правило 75 ходов',
    };
    return state.drawReason ? reasons[state.drawReason] : 'Ничья';
  }
  if (state.status === 'resigned')
    return state.winner === you ? 'Соперник сдался — победа' : 'Вы сдались';
  if (state.turn === you) return isInCheck(state, you) ? 'Ваш король под шахом' : 'Ваш ход';
  return isInCheck(state, state.turn) ? 'Соперник под шахом' : 'Ход соперника';
};

export const moveDetail = (move: MoveRecord): string => {
  if (move.castle) return move.notation;
  const capture = move.captured ? ` × ${pieceNames[move.captured]}` : '';
  const promotion = move.promotion ? ` =${move.promotion.toUpperCase()}` : '';
  return `${squareName(move.from)} → ${squareName(move.to)}${capture}${promotion}`;
};

export const capturedBy = (history: MoveRecord[], color: Color): MoveRecord[] =>
  history.filter((move) => move.color === color && move.captured);

export const lostBy = (history: MoveRecord[], color: Color): MoveRecord[] =>
  history.filter((move) => move.color === oppositeColor(color) && move.captured);

export function describeRoom(room: RoomView) {
  const waiting = room.playersCount < 2 && room.state.status === 'playing';
  return {
    label: waiting ? 'Ожидание соперника' : statusLabel(room.state, room.you.color),
    hint: waiting
      ? 'Пригласите соперника'
      : room.state.status === 'playing'
        ? 'Легальные ходы подсвечены'
        : 'Партия завершена',
    finished: room.state.status !== 'playing',
  };
}
