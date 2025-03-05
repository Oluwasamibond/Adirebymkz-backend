const express = require("express");
const Order = require("../orders/orders.model");
const crypto = require("crypto");
const router = express.Router();

router.post("/webhook-payment", async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  // Verify signature from Paystack
  const signature = req.headers["x-paystack-signature"];
  if (!signature) {
    return res.status(403).send("Missing Paystack signature");
  }

  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== signature) {
    return res.status(403).send("Invalid signature");
  }

  try {
    const { event, data } = req.body;

    if (event === "charge.success") {
      console.log("Webhook Payment Success:", data);

      // Extract the order reference from the Paystack data
      const orderReference = data.reference;

      // Update the order status in the database
      const updatedOrder = await Order.findOneAndUpdate(
        { orderId: orderReference }, // Find order by orderId (align with schema)
        { status: "paid" },          // Update status to "paid" (case-sensitive match with schema)
        { new: true }                // Return the updated document
      );

      if (!updatedOrder) {
        console.error(`Order with reference ${orderReference} not found`);
        return res.status(404).send("Order not found");
      }

      console.log("Order updated to paid:", updatedOrder);
    }

    res.status(200).send("Webhook received successfully");
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send("Webhook error");
  }
});

module.exports = router;