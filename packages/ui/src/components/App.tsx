import '../styles/app.scss';
import { useRef, useState } from 'react';
import type { UUID } from 'node:crypto';
import type { GameState, ServerMessage } from '@game/core';
import Connect from './Connect.tsx';
import Loader from './Loader.tsx';
import Game from './Game.tsx';

export default function App(): JSX.Element {
    const [loading, setLoading] = useState(false);
    const [playerId, setPlayerId] = useState<UUID | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const webSocketRef = useRef<WebSocket | null>(null);
    const connected = playerId !== null && gameState !== null;

    function connectToServer(username: string) {
        setLoading(true);

        webSocketRef.current = new WebSocket(
            `ws://${window.location.hostname}${
                process.env.NODE_ENV === 'production' ? '/game-server' : ':3010/'
            }?username=${username.trim()}`
        );

        webSocketRef.current.addEventListener('message', event => {
            const message: ServerMessage = JSON.parse(event.data);

            switch (message.type) {
                case 'updatePlayerId':
                    setPlayerId(message.data.id);
                    break;
                case 'updateGameState':
                    setGameState(message.data.gameState);
                    break;
            }
        });
    }

    return (
        <main>
            {loading && <Loader />}
            {connected ? (
                <Game
                    playerId={playerId}
                    gameState={gameState}
                    webSocket={webSocketRef.current!}
                    setLoading={setLoading}
                />
            ) : (
                <Connect connectToServer={connectToServer} />
            )}
        </main>
    );
}
