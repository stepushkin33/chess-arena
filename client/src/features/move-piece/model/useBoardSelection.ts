import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  areSameSquare,
  claimDraw,
  legalMovesForSquare,
  threatenedSquaresForColor,
  type Move,
  type RoomView,
  type Square,
} from '@chess/shared';
import type { SendCommand } from '../../../shared/api/useGameSocket';
import { canMovePiece } from '../../../entities/game/model/selectors';

export function useBoardSelection(room: RoomView, ready: boolean, send: SendCommand) {
  const [selected, setSelected] = useState<Square | null>(null);
  const [promotion, setPromotion] = useState<Move[] | null>(null);
  const [claimableMove, setClaimableMove] = useState<Move | null>(null);
  const locked = !canMovePiece(room, ready);
  const legalMoves = useMemo(
    () => (selected && !locked ? legalMovesForSquare(room.state, selected) : []),
    [room, selected, locked],
  );
  const threatenedSquares = useMemo(
    () => (!locked ? threatenedSquaresForColor(room.state, room.you.color) : []),
    [room, locked],
  );
  useEffect(() => {
    setSelected(null);
    setPromotion(null);
    setClaimableMove(null);
  }, [room]);
  const submitMove = useCallback(
    (move: Move) => {
      if (locked) return;
      if (claimDraw(room.state, move)) setClaimableMove(move);
      else send({ event: 'move', data: { move } });
      setPromotion(null);
    },
    [room, locked, send],
  );
  const choose = (square: Square): void => {
    if (locked) return;
    const moves = legalMoves.filter((move) => areSameSquare(move.to, square));
    if (moves.length > 1) {
      setPromotion(moves);
      return;
    }
    if (moves.length === 1) {
      submitMove(moves[0]);
      return;
    }
    setSelected(room.state.board[square.row][square.col]?.color === room.you.color ? square : null);
  };
  return {
    view: {
      state: room.state,
      selected,
      legalMoves,
      threatenedSquares,
      lastMove: room.state.moveHistory.at(-1) ?? null,
    },
    promotion,
    claimableMove,
    choose,
    submitMove,
    cancelPromotion: () => setPromotion(null),
    cancelClaim: () => setClaimableMove(null),
    confirmClaim: () => {
      if (claimableMove && !locked) send({ event: 'claim_draw', data: { move: claimableMove } });
      setClaimableMove(null);
    },
    playClaimMove: () => {
      if (claimableMove && !locked) send({ event: 'move', data: { move: claimableMove } });
      setClaimableMove(null);
    },
  };
}
