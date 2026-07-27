import app from './src/app.js';
import dotenv from 'dotenv';
import http from "http";
dotenv.config();
import {initSocketServer} from './src/sockets/socket.server.js';

const httpServer = http.createServer(app);

initSocketServer(httpServer);


httpServer.listen(3005, () => {
    console.log("Ai-Buddy service is running on port 3005");
}
);