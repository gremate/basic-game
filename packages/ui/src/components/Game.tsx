import '../styles/game.scss';
import { useEffect, useRef } from 'react';
import type { UUID } from 'node:crypto';
import type { ClientMessage, Controls, GameState, Player } from '@game/core';
import { bronzeColor, CoinType, defaultColor, goldColor, silverColor } from '@game/core';
import useRunLoop from '../hooks/useRunLoop.ts';

const coinColorsMap = {
    [CoinType.Gold]: goldColor,
    [CoinType.Silver]: silverColor,
    [CoinType.Bronze]: bronzeColor
} as const;

interface GameProps {
    playerId: UUID;
    gameState: GameState;
    webSocket: WebSocket;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Game({ playerId, gameState, webSocket, setLoading }: GameProps): JSX.Element {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const controlsRef = useRef<Controls>({
        upPressed: false,
        downPressed: false,
        leftPressed: false,
        rightPressed: false
    });
    const { timestamp, prevTimestamp } = useRunLoop();

    function drawCoins(context: CanvasRenderingContext2D) {
        gameState.coins.forEach(coin => {
            context.beginPath();

            context.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
            context.fillStyle = coinColorsMap[coin.type];
            context.fill();

            context.closePath();
        });
    }

    function drawPlayer(context: CanvasRenderingContext2D, player: Player) {
        context.beginPath();

        context.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        context.fillStyle = 'white';
        context.fill();

        context.closePath();

        context.beginPath();

        context.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        context.lineWidth = player.lineWidth;
        context.strokeStyle = player.color;
        context.stroke();

        context.closePath();

        context.font = '1.125rem sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = defaultColor;
        context.fillText(player.name, player.x, player.y - player.radius - 10);
    }

    function drawPlayers(context: CanvasRenderingContext2D) {
        gameState.players
            .filter(player => player.id !== playerId)
            .forEach(player => {
                drawPlayer(context, player);
            });

        const currentPlayer = gameState.players.find(player => player.id === playerId);

        if (currentPlayer) {
            drawPlayer(context, currentPlayer);
        }
    }

    function draw() {
        const context = canvasRef.current?.getContext('2d');

        if (context) {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);

            drawCoins(context);
            drawPlayers(context);
        }
    }

    function handleMovement() {
        const { upPressed, downPressed, leftPressed, rightPressed } = controlsRef.current;

        if (upPressed || downPressed || leftPressed || rightPressed) {
            const message: ClientMessage = {
                type: 'updatePlayerPosition',
                data: {
                    playerId,
                    controls: controlsRef.current,
                    timestamp,
                    prevTimestamp
                }
            };

            webSocket.send(JSON.stringify(message));
        }
    }

    useEffect(() => {
        const controlsMap: { [key: string]: keyof Controls } = {
            w: 'upPressed',
            ArrowUp: 'upPressed',
            s: 'downPressed',
            ArrowDown: 'downPressed',
            a: 'leftPressed',
            ArrowLeft: 'leftPressed',
            d: 'rightPressed',
            ArrowRight: 'rightPressed'
        };

        function onKeyDown(event: KeyboardEvent) {
            if (event.repeat) {
                return;
            }

            const property = controlsMap[event.key];

            if (property) {
                controlsRef.current[property] = true;
            }
        }

        function onKeyUp(event: KeyboardEvent) {
            const property = controlsMap[event.key];

            if (property) {
                controlsRef.current[property] = false;
            }
        }

        setLoading(false);

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        handleMovement();
        draw();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timestamp, prevTimestamp]);

    return (
        <div className="flexbox flexbox-justify-content-center height-100">
            <canvas ref={canvasRef} className="game-canvas" height={gameState.map.height} width={gameState.map.width} />
        </div>
    );
}
