import amqplib from 'amqplib';

let channel, connection;

async function connect() {
    if(connection) return connection;
    try {
        connection = await amqplib.connect(process.env.RABBIT_URL);

        console.log('Connected to RabbitMQ');
        channel = await connection.createChannel();

    }
    catch (error) {
        console.error('Error connecting to RabbitMQ:', error);
    }
}

async  function publishToQueue(queueName, data = {}) {
    if (!channel||!connection) {
        await connect();
    }
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
        persistent: true,
    });
    console.log("Message sent to queue:", queueName, "with data:", data);

}
async function subscribeToQueue(queueName, callback) {
    if (!channel||!connection) {
        await connect();
    }
    await channel.assertQueue(queueName, { durable: true });
    await channel.consume(queueName,async (msg) => {
        if (msg !== null) {
            const data = JSON.parse(msg.content.toString());
            await callback(data);
            channel.ack(msg);
        }
    });

}
export{ connect, channel, connection, publishToQueue, subscribeToQueue 
    
};