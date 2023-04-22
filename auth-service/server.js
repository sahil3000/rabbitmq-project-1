const express = require('express');
const mongoose = require('mongoose');
const User = require('./UserModel');
const jwt = require("jsonwebtoken");

const port = 7070;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// mongoDb connection
const connnectDb = async () => {
    try {
        const response = await mongoose.connect('mongodb://localhost:27017/auth-service-db')
        console.log("connected to mongoDB")
    } catch (err) {
        console.log("Failed to connect mongoDB", err.message)
    }
}
connnectDb();

app.get("/", (req, res) => {
    res.send("welcome to auth services")
});


app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.json({ error: true, body: [], message: "All field are mandatory" });
    }
    
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.json({ error: true, body: [], message: "User already exists" });
        } else {
            const newUser = new User({
                email,
                name,
                password,
            });
            await newUser.save();
            return res.json({ error: false, body: newUser, message: "User successfully register" });
        }
    } catch (err) {
        return res.json({ error: true, body: [], message: err.message });
    }
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.json({ error: true, body: [], message: "All field are mandatory" });
    }
    const user = await User.findOne({ email });
    if (!user) {
        return res.json({ message: "User doesn't exist" });
    } else {
        if (password !== user.password) {
            return res.json({ message: "Password Incorrect" });
        }
        const payload = {
            email,
            name: user.name
        };
        jwt.sign(payload, "secret", (err, token) => {
            if (err) console.log(err);
            else return res.json({ token: token });
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at port ${port}`)
});