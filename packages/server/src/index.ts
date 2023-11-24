import { WebSocketServer } from 'ws';

const port = 3010;
const wss = new WebSocketServer({ port }, () =>
    console.log(`Game server started on PORT: ${port} with PID: ${process.pid}`)
);

wss.on('connection', ws => {
    ws.send('message from server'); //TODO: remove it
});

wss.on('error', console.error);

function onSignal(signal: NodeJS.Signals) {
    console.log(`${signal} signal received. Game server is shutting down.`);

    wss.close();
    wss.clients.forEach(x => x.close());
}

process.on('SIGINT', onSignal);
process.on('SIGTERM', onSignal);
