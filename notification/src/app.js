import express from 'express';
import { connect,subscribeToQueue } from './broker/broker.js';
import setListners from './broker/listner.js';   

connect().then(()=>{
    setListners();
})
const app = express();

app.get('/', (req, res) => {
    res.send('Notification Service is running');
})


export default app;
