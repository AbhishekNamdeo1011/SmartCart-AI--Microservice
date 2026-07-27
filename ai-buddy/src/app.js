import express from 'express';
import cookieParser from 'cookie-parser';
const app = express();

app.get('/', (req, res) => {
    res.status(200).json({ message: "Ai  Service is running" });
});

app.use(express.json());
app.use(cookieParser());



export default app;


