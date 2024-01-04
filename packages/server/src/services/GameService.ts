import type { IncomingMessage } from 'http';
import { randomUUID, type UUID } from 'node:crypto';
import WebSocket, { WebSocketServer } from 'ws';
import type {
    Circle,
    ClientMessage,
    Coin,
    GameState,
    Player,
    ServerMessage,
    UpdatePlayerPositionClientMessageData
} from '@game/core';
import { coinRadius, CoinType, playerLineWidth, playerRadius, Utilities } from '@game/core';

export default class GameService {
    private readonly port = 3010;
    private readonly playerSpeed = 100 / 1000; // 100px / 1s
    private readonly maxCoinCount = 10;
    private readonly coinValuesMap = {
        [CoinType.Gold]: 6,
        [CoinType.Silver]: 3,
        [CoinType.Bronze]: 1
    } as const;
    private readonly webSocketServer: WebSocketServer;
    private readonly gameState: GameState;

    private coinSpawningTimeoutId: NodeJS.Timeout | null = null;

    constructor() {
        this.webSocketServer = new WebSocketServer({ port: this.port }, () =>
            console.log(`Game server started on PORT: ${this.port} with PID: ${process.pid}`)
        );
        this.gameState = { players: [], map: { height: 600, width: 800 }, coins: [] };

        this.addWebSocketServerEventListeners();
    }

    public shutdown() {
        this.webSocketServer.close();
        this.webSocketServer.clients.forEach(x => x.close());
        this.stopCoinSpawning();
    }

    private addWebSocketServerEventListeners() {
        this.webSocketServer.on('connection', (webSocket, request) => {
            const playerId = this.addPlayer(webSocket, request);

            if (this.coinSpawningTimeoutId === null && this.gameState.players.length > 1) {
                this.startCoinSpawning();
            }

            webSocket.on('close', () => {
                this.removePlayer(playerId);

                if (this.gameState.players.length <= 1) {
                    this.stopCoinSpawning();
                }
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

            this.absorbCoins(player);
            this.sendGameState();
        }
    }

    private absorbCoins(player: Player) {
        const absorbableCoins = this.gameState.coins.filter(coin => this.isAbsorbable(player, coin));

        absorbableCoins.forEach(coin => {
            const index = this.gameState.coins.indexOf(coin);

            player.radius = player.radius + this.coinValuesMap[coin.type];
            this.gameState.coins.splice(index, 1);
        });
    }

    private isAbsorbable(circle: Circle, circleToAbsorb: Circle) {
        const distanceBetweenCenters = Math.sqrt(
            (circle.x - circleToAbsorb.x) ** 2 + (circle.y - circleToAbsorb.y) ** 2
        );

        return distanceBetweenCenters + circleToAbsorb.radius <= circle.radius;
    }

    private startCoinSpawning() {
        const loop = () => {
            this.coinSpawningTimeoutId = setTimeout(
                () => {
                    this.spawnCoin();
                    loop();
                },
                Utilities.randomInteger(5, 10) * 1000
            );
        };

        this.coinSpawningTimeoutId = setTimeout(() => {
            this.spawnCoin();
            loop();
        }, 5000);
    }

    private spawnCoin() {
        if (this.gameState.coins.length < this.maxCoinCount) {
            const random = Math.random();

            const coin: Coin = {
                x: Utilities.randomInteger(50, this.gameState.map.width - 50),
                y: Utilities.randomInteger(50, this.gameState.map.height - 50),
                radius: coinRadius,
                type: random <= 0.1 ? CoinType.Gold : random <= 0.35 ? CoinType.Silver : CoinType.Bronze
            };

            this.gameState.coins.push(coin);
            this.sendGameState();
        }
    }

    private stopCoinSpawning() {
        if (this.coinSpawningTimeoutId) {
            clearTimeout(this.coinSpawningTimeoutId);

            this.coinSpawningTimeoutId = null;
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
