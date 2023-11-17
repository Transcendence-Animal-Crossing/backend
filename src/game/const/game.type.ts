// export enum GameType {
//   RANK = 'RANK',
//   SPECIAL = 'SPECIAL',
//   CLASSIC = 'CLASSIC',
// }

export const GAMETYPE_CLASSIC = 'CLASSIC' as const;
export const GAMETYPE_SPECIAL = 'SPECIAL' as const;
export const GAMETYPE_RANK = 'RANK' as const;

export type GameType = 'CLASSIC' | 'SPECIAL' | 'RANK';
