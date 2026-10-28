import { useGameActions } from '../model/useGameActions';
import { ConfirmActionDialog, IncomingOfferDialog } from './ActionDialogs';

export function GameActions(): JSX.Element {
  const game = useGameActions();
  return (
    <>
      <div className="sidebar-actions">
        {game.playing ? (
          <>
            <button
              className="ghost-button"
              disabled={game.drawPending ? !game.connected : !game.canOfferDraw}
              onClick={game.drawPending ? game.withdraw : () => game.ask('draw')}
            >
              {game.drawPending ? 'Отозвать предложение' : 'Предложить ничью'}
            </button>
            <button
              className="ghost-button danger-button"
              disabled={game.locked}
              onClick={() => game.ask('resign')}
            >
              Сдаться
            </button>
            {game.canClaimDraw && (
              <button className="primary-button" onClick={game.claim}>
                Заявить ничью по правилам
              </button>
            )}
          </>
        ) : (
          <button className="primary-button" disabled={game.locked} onClick={game.rematch}>
            {game.rematchPending ? 'Предложение отправлено' : 'Новая партия'} <span>↻</span>
          </button>
        )}
      </div>
      <ConfirmActionDialog
        action={game.confirmation}
        onConfirm={game.confirm}
        onCancel={game.cancel}
      />
      <IncomingOfferDialog
        kind={game.incoming}
        opponentName={game.opponentName}
        disabled={!game.connected}
        onRespond={game.respond}
      />
    </>
  );
}
