const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET_KEY;

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Extract the token

    if (!token) {
      return res.status(401).send({ message: "Invalid token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) {
      return res.status(401).send({ message: "Invalid token or not valid" });
    }

    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    console.error("Error while verifying token", error);
    res.status(401).send({ message: "Error while verifying token" });
  }
};

module.exports = verifyToken;