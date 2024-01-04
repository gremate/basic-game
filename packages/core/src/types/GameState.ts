import type { Coin, Map, Player } from './index.js';

export interface GameState {
    players: Player[];
    map: Map;
    coins: Coin[];
}
