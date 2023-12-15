import type { UUID } from 'node:crypto';
import type { Controls, GameState } from './index.js';

export type ServerMessage =
    | {
          type: 'updatePlayerId';
          data: { id: UUID };
      }
    | {
          type: 'updateGameState';
          data: { gameState: GameState };
      };

export type ClientMessage = {
    type: 'updatePlayerPosition';
    data: UpdatePlayerPositionClientMessageData;
};

export type UpdatePlayerPositionClientMessageData = {
    playerId: UUID;
    controls: Controls;
    timestamp: number;
    prevTimestamp: number;
};
