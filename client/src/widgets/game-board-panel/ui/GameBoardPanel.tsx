import {
  useActiveRoom,
  useSessionActions,
  useSessionState,
} from '../../../entities/session/model/SessionProvider';
import { useBoardSelection } from '../../../features/move-piece/model/useBoardSelection';
import { PromotionModal } from '../../../features/pawn-promotion/ui/PromotionModal';
import { DrawClaimModal } from '../../../features/draw-claim/ui/DrawClaimModal';
import { PlayerStrip } from '../../../entities/game/ui/PlayerStrip';
import { CapturedPieces } from '../../../entities/game/ui/CapturedPieces';
import { ChessBoard } from '../../../entities/game/ui/ChessBoard';
import { GameStatus, TurnBanner } from '../../../entities/session/ui/GameStatus';

export function GameBoardPanel(): JSX.Element {
  const room = useActiveRoom();
  const { connected } = useSessionState();
  const { send } = useSessionActions();
  const selection = useBoardSelection(room, connected, send);
  return (
    <section className="board-column">
      <PlayerStrip player={room.opponent} />
      <TurnBanner />
      <GameStatus variant="compact" />
      <ChessBoard
        view={selection.view}
        orientation={room.you.color}
        onSquareClick={selection.choose}
      />
      <CapturedPieces moves={room.state.moveHistory} color={room.you.color} />
      <PlayerStrip player={room.you} self />
      <PromotionModal
        moves={selection.promotion}
        color={room.you.color}
        onSelect={selection.submitMove}
        onCancel={selection.cancelPromotion}
      />
      <DrawClaimModal
        open={Boolean(selection.claimableMove)}
        onClaim={selection.confirmClaim}
        onPlay={selection.playClaimMove}
        onCancel={selection.cancelClaim}
      />
    </section>
  );
}
