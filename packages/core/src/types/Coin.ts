import type { Circle } from './index.js';
import type { CoinType } from '../enums/index.js';

export interface Coin extends Circle {
    type: CoinType;
}
