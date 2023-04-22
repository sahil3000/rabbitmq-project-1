const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 8080;
const mongoose = require("mongoose");
const Product = require("./ProductModel");
const jwt = require("jsonwebtoken");
const amqp = require("amqplib");
const isAuthenticated = require("../isAuthenicated");
var order;

var channel, connection;

app.use(express.json());

// mongoDb connection
const connnectDb = async () => {
    try {
        const response = await mongoose.connect('mongodb://localhost:27017/product-service-db')
        console.log("connected to mongoDB")
    } catch (err) {
        console.log("Failed to connect mongoDB", err.message)
    }
}
connnectDb();

async function connectRabitMQ() {
    const amqpServer = "amqp://localhost:5672";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    // console.log("connect rabbitmq", channel)
    await channel.assertQueue("PRODUCT");
}
connectRabitMQ();

app.post("/api/product/buy", isAuthenticated, async (req, res) => {
    const { ids } = req.body;
    const products = await Product.find({ _id: { $in: ids } });
    channel.sendToQueue(
        "ORDER",
        Buffer.from(
            JSON.stringify({
                products,
                userEmail: req.user.email,
            })
        )
    );
    channel.consume("PRODUCT", (data) => {
        console.log("enter into database")
        order = JSON.parse(data.content);
    });
    res.json(order);
});

app.post("/api/product/create", isAuthenticated, async (req, res) => {
    const { name, description, price } = req.body;

    if (!name || !description || !price) {
        return res.json({ msg: 'all field are mandatory' })
    }

    const newProduct = new Product({
        name,
        description,
        price,
    });
    await newProduct.save();
    return res.json(newProduct);
});


app.listen(PORT, () => {
    console.log(`Product-Service at ${PORT}`);
});