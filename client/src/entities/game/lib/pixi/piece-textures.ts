import { Assets, type Texture } from 'pixi.js';
import type { Color, Piece, PieceType } from '@chess/shared';
import { pieceAssetUrl } from '../piece-assets';

export type PieceTextures = Map<string, Texture>;
export const textureKey = (piece: Piece): string => `${piece.color}-${piece.type}`;
let loading: Promise<PieceTextures> | undefined;

export const loadPieceTextures = (): Promise<PieceTextures> => {
  // Assets caches textures. A board's destruction must not destroy shared textures.
  loading ??= Promise.all(
    (['white', 'black'] as Color[]).flatMap((color) =>
      (['p', 'n', 'b', 'r', 'q', 'k'] as PieceType[]).map(async (type) => {
        const texture = await Assets.load<Texture>({
          src: pieceAssetUrl(color, type),
          data: { resourceOptions: { width: 240, height: 240 } },
        });
        return [textureKey({ color, type }), texture] as const;
      }),
    ),
  )
    .then((entries) => new Map(entries))
    .catch((error) => {
      loading = undefined;
      throw error;
    });
  return loading;
};
