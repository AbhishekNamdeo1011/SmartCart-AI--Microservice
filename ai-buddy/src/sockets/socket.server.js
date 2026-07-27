import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import agent from "../agent/agent.js  ";
async function initSocketServer(httpServer) {
    const io = new Server(httpServer, {})

    io.use((socket, next) => {
        const cookies = socket.handshake.headers?.cookie
        const { token } = cookies ? cookie.parse(cookies) : {};
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            socket.token = token;
            next();
        } catch (err) {
            return next(new Error("Authentication error: Invalid token"));
        }
    })  



    io.on("connection", (socket) => {
        console.log("Socket connected with user:", socket.user, "and token:", socket.token  );
        console.log("New client connected")

        socket.on ('message', async (data) => {
            const agentResponse = await agent.invoke({
                messages: [
                    {
                        role: "user",
                        content: data,
                    }
                ]
            }, { metadata: { token: socket.token } })

            console.log("Agent response:", agentResponse);
            const lastMessage = agentResponse.messages[agentResponse.messages.length - 1];
            socket.emit("message", lastMessage.content);
        });

    })

}



export { initSocketServer };