export const CoinType = {
    Bronze: 'bronze',
    Silver: 'silver',
    Gold: 'gold'
} as const;

export type CoinType = (typeof CoinType)[keyof typeof CoinType];
