const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const razorpay = require("../../helpers/razorpay");
const crypto = require("crypto");

// 🔥 CREATE RAZORPAY ORDER
const createRazorpayOrder = async (req, res) => {
try {
const { amount } = req.body;

const options = {
  amount: amount * 100, // convert to paisa
  currency: "INR",
  receipt: "receipt_order_" + Date.now(),
};

const order = await razorpay.orders.create(options);

res.status(200).json(order);

} catch (error) {
console.log(error);
res.status(500).json({ message: "Error creating order" });
}
};

// 🔥 VERIFY PAYMENT + SAVE ORDER
const verifyPayment = async (req, res) => {
try {
const {
order_id,
payment_id,
signature,
userId,
cartItems,
addressInfo,
totalAmount,
cartId,
} = req.body;

// 🔐 Verify signature
const generated_signature = crypto
  .createHmac("sha256", process.env.KEY_SECRET)
  .update(order_id + "|" + payment_id)
  .digest("hex");

if (generated_signature !== signature) {
  return res.status(400).json({ success: false });
}

// ✅ CREATE ORDER (same as COD)
const newlyCreatedOrder = new Order({
  userId,
  cartId,
  cartItems,
  addressInfo,
  orderStatus: "confirmed",
  paymentMethod: "razorpay",
  paymentStatus: "paid",
  totalAmount,
  paymentId: payment_id,
  orderDate: new Date(),
  orderUpdateDate: new Date(),
});

await newlyCreatedOrder.save();

// 🔻 Reduce product stock
for (let item of cartItems) {
  const product = await Product.findById(item.productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  if (product.totalStock < item.quantity) {
    return res.status(400).json({
      success: false,
      message: `Not enough stock for ${product.title}`,
    });
  }

  product.totalStock -= item.quantity;
  await product.save();
}

// 🧹 Delete cart
await Cart.findByIdAndDelete(cartId);

return res.json({
  success: true,
  message: "Order placed successfully via Razorpay",
});

} catch (error) {
console.log(error);
res.status(500).json({ success: false });
}
};

// 🔥 CREATE ORDER (COD)
const createOrder = async (req, res) => {
try {
const {
userId,
cartItems,
addressInfo,
paymentMethod,
totalAmount,
cartId,
} = req.body;

const newlyCreatedOrder = new Order({
  userId,
  cartId,
  cartItems,
  addressInfo,
  orderStatus: "confirmed",
  paymentMethod: paymentMethod || "COD",
  paymentStatus: "pending",
  totalAmount,
  orderDate: new Date(),
  orderUpdateDate: new Date(),
});

await newlyCreatedOrder.save();

for (let item of cartItems) {
  const product = await Product.findById(item.productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  if (product.totalStock < item.quantity) {
    return res.status(400).json({
      success: false,
      message: `Not enough stock for ${product.title}`,
    });
  }

  product.totalStock -= item.quantity;
  await product.save();
}

await Cart.findByIdAndDelete(cartId);

res.status(201).json({
  success: true,
  message: "Order placed successfully",
  orderId: newlyCreatedOrder._id,
});

} catch (e) {
console.log(e);
res.status(500).json({
success: false,
message: "Some error occurred!",
});
}
};

// 🔥 GET ALL ORDERS BY USER
const getAllOrdersByUser = async (req, res) => {
try {
const { userId } = req.params;

const orders = await Order.find({ userId });

if (!orders.length) {
  return res.status(404).json({
    success: false,
    message: "No orders found!",
  });
}

res.status(200).json({
  success: true,
  data: orders,
});

} catch (e) {
console.log(e);
res.status(500).json({
success: false,
message: "Some error occurred!",
});
}
};

// 🔥 GET ORDER DETAILS
const getOrderDetails = async (req, res) => {
try {
const { id } = req.params;

const order = await Order.findById(id);

if (!order) {
  return res.status(404).json({
    success: false,
    message: "Order not found!",
  });
}

res.status(200).json({
  success: true,
  data: order,
});

} catch (e) {
console.log(e);
res.status(500).json({
success: false,
message: "Some error occurred!",
});
}
};

module.exports = {
createOrder,
getAllOrdersByUser,
getOrderDetails,
createRazorpayOrder,
verifyPayment,
};