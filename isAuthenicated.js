const jwt = require("jsonwebtoken");

module.exports = async function isAuthenticated(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) {
        return res.json({ message: 'please provide token' });
    }
    jwt.verify(token, "secret", (err, user) => {
        if (err) {
            return res.json({ message: err });
        } else {
            req.user = user;
            next();
        }
    });

};