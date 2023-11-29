import '../styles/app.scss';
import { useRef, useState } from 'react';
import Connect from './Connect';
import Loader from './Loader';

export default function App() {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    function connectToServer(username: string) {
        setLoading(true);

        wsRef.current = new WebSocket(
            `ws://${window.location.hostname}${
                process.env.NODE_ENV === 'production' ? '/game-server' : ':3010/'
            }?username=${username.trim()}`
        );

        wsRef.current.addEventListener('open', () => {
            setConnected(true);
            setLoading(false);
        });

        wsRef.current.addEventListener('message', event => {
            console.log(event); //TODO: remove it
        });
    }

    return (
        <main>
            {loading && <Loader />}
            {connected ? null : <Connect connectToServer={connectToServer} />}
        </main>
    );
}
