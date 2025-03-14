const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
require("dotenv").config();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const port = process.env.PORT || 5000;

// middleware setup
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb" }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "https://adirebymkz-finito.vercel.app",
    credentials: true,
  })
);

// image upload
const uploadImage = require("./src/utils/uploadImage");
// all routes
const authRoutes = require("./src/users/user.route");
const productRoutes = require("./src/products/products.route");
const reviewRoutes = require("./src/reviews/reviews.router");
const orderRoutes = require("./src/orders/orders.route");
const webhookRoutes = require("./src/webhook/webhook.route");
const statsRoutes = require("./src/stats/stats.route");

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/stats", statsRoutes);

app.get("/", (req, res) => {
  res.send("Adirebymkz server running...");
});

main()
  .then(() => console.log("Mongodb is connected"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.DB_URL);

}

app.post("/uploadImage", (req, res) => {
  uploadImage(req.body.image)
    .then((url) => res.send(url))
    .catch((err) => res.status(500).send(err));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
