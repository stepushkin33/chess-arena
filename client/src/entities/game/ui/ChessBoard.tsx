import { useEffect, useRef, useState } from 'react';
import type { Color, Square } from '@chess/shared';
import { BoardScene, type BoardView } from '../lib/pixi/board-scene';
import { loadPieceTextures } from '../lib/pixi/piece-textures';

interface ChessBoardProps {
  view: BoardView;
  orientation: Color;
  onSquareClick: (square: Square) => void;
}

export function ChessBoard(props: ChessBoardProps): JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BoardScene>();
  const current = useRef(props);
  const [error, setError] = useState('');
  current.current = props;

  useEffect(() => {
    let disposed = false;
    setError('');
    loadPieceTextures()
      .then((textures) => {
        if (disposed || !host.current) return;
        scene.current = new BoardScene(host.current, props.orientation, textures, (square) =>
          current.current.onSquareClick(square),
        );
        scene.current.update(current.current.view);
      })
      .catch(() => {
        if (!disposed) setError('Не удалось загрузить фигуры. Обновите страницу.');
      });
    return () => {
      disposed = true;
      scene.current?.destroy();
      scene.current = undefined;
    };
  }, [props.orientation]);

  useEffect(() => {
    scene.current?.update(props.view);
  }, [props.view]);
  return (
    <div className="pixi-board" ref={host} aria-label="Шахматная доска">
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
