import '../styles/game.scss';
import { useEffect, useRef } from 'react';
import type { UUID } from 'node:crypto';
import type { ClientMessage, Controls, GameState } from '@game/core';
import { defaultColor } from '@game/core';
import useRunLoop from '../hooks/useRunLoop.ts';

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

    function drawPlayers(context: CanvasRenderingContext2D) {
        gameState.players.forEach(player => {
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
        });
    }

    function draw() {
        const context = canvasRef.current?.getContext('2d');

        if (context) {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);

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
