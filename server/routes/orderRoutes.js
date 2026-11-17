const express = require("express");
const router = express.Router();

const { calculateCheckout } = require("../controllers/orderController");

// Public calculation endpoint for cart & checkout validation
router.post("/calculate-checkout", calculateCheckout);

module.exports = router;
