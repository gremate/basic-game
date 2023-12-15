import GameService from './services/GameService.js';

const gameService = new GameService();

function onSignal(signal: NodeJS.Signals) {
    console.log(`${signal} signal received. Game server is shutting down.`);

    gameService.shutdown();
}

process.on('SIGINT', onSignal);
process.on('SIGTERM', onSignal);
