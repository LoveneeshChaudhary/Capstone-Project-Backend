const express = require("express");
const router = express.Router();

const {
createOrder,
getAllOrdersByUser,
getOrderDetails,
createRazorpayOrder,
verifyPayment
} = require("../../controllers/shop/order-controller");

// 🔹 COD order
router.post("/create", createOrder);

// 🔹 Razorpay
router.post("/razorpay-order", createRazorpayOrder);
router.post("/verify", verifyPayment);

// 🔹 Orders
router.get("/list/", getAllOrdersByUser);
router.get("/details/", getOrderDetails);

module.exports = router;