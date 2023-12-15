import type { IncomingMessage } from 'http';
import { randomUUID, type UUID } from 'node:crypto';
import WebSocket, { WebSocketServer } from 'ws';
import type {
    ClientMessage,
    GameState,
    Player,
    ServerMessage,
    UpdatePlayerPositionClientMessageData
} from '@game/core';
import { Utilities, playerLineWidth, playerRadius } from '@game/core';

export default class GameService {
    private readonly port = 3010;
    private readonly playerSpeed = 100 / 1000; // 100px / 1s
    private readonly webSocketServer: WebSocketServer;
    private readonly gameState: GameState;

    constructor() {
        this.webSocketServer = new WebSocketServer({ port: this.port }, () =>
            console.log(`Game server started on PORT: ${this.port} with PID: ${process.pid}`)
        );
        this.gameState = { players: [], map: { height: 600, width: 800 } };

        this.addWebSocketServerEventListeners();
    }

    public shutdown() {
        this.webSocketServer.close();
        this.webSocketServer.clients.forEach(x => x.close());
    }

    private addWebSocketServerEventListeners() {
        this.webSocketServer.on('connection', (webSocket, request) => {
            const playerId = this.addPlayer(webSocket, request);

            webSocket.on('close', () => {
                this.removePlayer(playerId);
            });

            webSocket.on('message', data => {
                const message: ClientMessage = JSON.parse(data.toString());

                switch (message.type) {
                    case 'updatePlayerPosition':
                        this.updatePlayerPosition(message.data);
                        break;
                }
            });
            //TODO: add other listeners
        });

        this.webSocketServer.on('error', console.error);
    }

    private addPlayer(webSocket: WebSocket, request: IncomingMessage) {
        const id = randomUUID();
        const name = (new URLSearchParams(request.url?.substring(1)).get('username') as string).trim();
        const player: Player = {
            id,
            name,
            x: playerRadius * 2,
            y: playerRadius * 2,
            radius: playerRadius,
            lineWidth: playerLineWidth,
            color: Utilities.randomColor()
        };

        this.gameState.players.push(player);
        this.sendPlayerId(webSocket, id);
        this.sendGameState();

        return id;
    }

    private removePlayer(id: UUID) {
        this.gameState.players = this.gameState.players.filter(x => x.id !== id);

        this.sendGameState();
    }

    private updatePlayerPosition(data: UpdatePlayerPositionClientMessageData) {
        const { playerId, timestamp, prevTimestamp } = data;
        const { upPressed, downPressed, leftPressed, rightPressed } = data.controls;
        const player = this.gameState.players.find(x => x.id === playerId);

        if (player) {
            if ((upPressed && !downPressed) || (!upPressed && downPressed)) {
                const dY = (timestamp - prevTimestamp) * this.playerSpeed * (upPressed ? -1 : 1);
                const newY = Math.min(
                    Math.max(player.y + dY, player.radius + player.lineWidth),
                    this.gameState.map.height - (player.radius + player.lineWidth)
                );

                player.y = newY;
            }

            if ((leftPressed && !rightPressed) || (!leftPressed && rightPressed)) {
                const dX = (timestamp - prevTimestamp) * this.playerSpeed * (leftPressed ? -1 : 1);
                const newX = Math.min(
                    Math.max(player.x + dX, player.radius + player.lineWidth),
                    this.gameState.map.width - (player.radius + player.lineWidth)
                );

                player.x = newX;
            }

            this.sendGameState();
        }
    }

    private sendPlayerId(webSocket: WebSocket, id: UUID) {
        const message: ServerMessage = { type: 'updatePlayerId', data: { id } };

        this.sendMessage(webSocket, message);
    }

    private sendGameState(webSockets?: WebSocket | WebSocket[]) {
        const message: ServerMessage = { type: 'updateGameState', data: { gameState: this.gameState } };

        (webSockets === undefined
            ? Array.from(this.webSocketServer.clients)
            : Array.isArray(webSockets)
              ? webSockets
              : [webSockets]
        ).forEach(x => {
            this.sendMessage(x, message);
        });
    }

    private sendMessage(webSocket: WebSocket, message: ServerMessage) {
        if (webSocket.readyState === WebSocket.OPEN) {
            webSocket.send(JSON.stringify(message));
        }
    }
}
