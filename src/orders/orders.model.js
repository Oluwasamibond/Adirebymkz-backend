const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: String,
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    phoneNumber: { type: String, required: true },
    shippingMethod: {
      name: String,
      price: Number,
      deliveryTime: String,
    },
    products: [
      {
        productId: { type: String, required: true },
        name: {type: String, required: true},
        category:{type: String, required: true},
        price: {type: Number, required: true},
        color: {type: String, required: true},
        quantity: { type: Number, required: true },
        yard: { type: Number, required: true },
      },
    ],
    amount: Number,
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
