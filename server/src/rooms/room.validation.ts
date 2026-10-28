import { isInside, type Move } from '@chess/shared';

export const safeName = (value: unknown): string =>
  typeof value === 'string'
    ? value
        .trim()
        .replace(/[^\p{L}\p{N} _-]/gu, '')
        .slice(0, 20) || 'Игрок'
    : 'Игрок';

export const isMove = (value: unknown): value is Move => {
  if (!value || typeof value !== 'object') return false;
  const move = value as Move;
  return Boolean(
    move.from &&
    move.to &&
    isInside(move.from) &&
    isInside(move.to) &&
    (move.promotion === undefined || ['q', 'r', 'b', 'n'].includes(move.promotion)),
  );
};
