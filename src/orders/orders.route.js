const express = require("express");
const axios = require("axios");
const Order = require("./orders.model");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
require("dotenv").config();

const router = express.Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Create checkout session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const {
      email,
      amount,
      name,
      address,
      phoneNumber,
      shippingMethod,
      products,
    } = req.body;

    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount,
        currency: "NGN",
        callback_url: "https://adirebymkz-final.vercel.app/success", // Redirect after payment
        metadata: {
          name,
          phoneNumber, 
          address: {
            street: address?.street || "N/A",
            city: address?.city || "N/A",
            state: address?.state || "N/A",
            postalCode: address?.postalCode || "N/A",
          },
          shippingMethod,
          products,
        },
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    if (paystackResponse.data && paystackResponse.data.data.authorization_url) {
      res.status(200).json({
        authorizationUrl: paystackResponse.data.data.authorization_url,
      });
    } else {
      res.status(400).json({ message: "Failed to initialize payment." });
    }
  } catch (error) {
    console.error("Error initializing checkout session:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Confirm Paystack Payment
router.post("/confirm-payment", async (req, res) => {
  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ message: "Payment reference is required" });
  }

  try {
    const { data } = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Paystack response:", data); // Log Paystack response

    const paymentData = data?.data;

    if (!paymentData || paymentData.status !== "success") {
      return res.status(400).json({
        message: "Payment verification failed",
        details: data,
      });
    }

    // Extract details
    const paymentIntentId = paymentData.reference;
    const amount = paymentData.amount / 100;
    const email = paymentData.customer?.email;
    const metadata = paymentData.metadata || {}; // Ensure metadata exists
    const name = metadata.name || "N/A";
    const phoneNumber = metadata.phoneNumber || "N/A"; // ✅ Correct extraction of phone
    const address = metadata.address || {
      street: "N/A",
      city: "N/A",
      state: "N/A",
      postalCode: "N/A",
    };
    const shippingMethod = metadata.shippingMethod || {
      name: "N/A",
      price: 0,
      deliveryTime: "N/A",
    };
    

    const products = Array.isArray(metadata.products) ? metadata.products : [];

 

    console.log("Extracted payment details:", {
      paymentIntentId,
      amount,
      email,
      name,
      phoneNumber, // ✅ Fixing phoneNumber extraction
      address,
      shippingMethod,
      products,
    });


    // Save to database
    const order = await Order.findOneAndUpdate(
      { orderId: paymentIntentId },
      {
        orderId: paymentIntentId,
        amount,
        products,
        email,
        name,
        phoneNumber,
        address,
        shippingMethod,
        status: "pending",
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      message: "Payment successfully verified",
      order,
    });
  } catch (error) {
    console.error(
      "Error verifying payment:",
      error.response?.data || error.message
    );
    return res
      .status(500)
      .json({ message: "Failed to confirm payment", error: error.message });
  }
});

// get order by email address
router.get("/:email", async (req, res) => {
  const email = req.params.email;
  if (!email) {
    return res.status(400).send({ message: "Email is required" });
  }

  try {
    const orders = await Order.find({ email: email });

    if (orders.length === 0) {
      return res
        .status(400)
        .send({ order: 0, message: "No orders found for this email" });
    }
    res.status(200).send({ orders });
  } catch (error) {
    console.error("Error fetching orders by email", error);
    res.status(500).send({ message: "Failed to fetch orders by email" });
  }
});

// get order by id
router.get("/order/:id", async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id });

    if (!order) {
      return res.status(400).send({ message: "Order not found" });
    }
    res.status(200).send({ order });
  } catch (error) {
    console.error("Error fetching orders by user id", error);
    res.status(500).send({ message: "Failed to fetch orders by user id" });
  }
});

// get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    if (orders.length === 0) {
      return res.status(400).send({ message: "No orders found", orders: [] });
    }
    res.status(200).send(orders);
  } catch (error) {
    console.error("Error fetching all orders", error);
    res.status(500).send({ message: "Failed to fetch all orders" });
  }
});

// update order status
router.patch("/update-order-status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).send({ message: "Status is required" });
  }
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedOrder) {
      return res.status(404).send({ message: "Order not found" });
    }
    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status", error);
    res.status(500).send({ message: "Failed to update order status" });
  }
});

// delete order
router.delete("/delete-order/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) {
      return res.status(404).send({ message: "Order not found" });
    }
    res.status(200).json({
      message: "Order deleted successfully",
      order: deletedOrder,
    });
  } catch (error) {
    console.error("Error deleting order", error);
    res.status(500).send({ message: "Failed to delete order" });
  }
});

module.exports = router;
