const express = require("express");

const {
    createBill,
    getBills,
    getBillById,
    generateBillPDF
} = require("../controllers/billController");

const protect = require("../middleware/authMiddleware");


const router = express.Router();


// Protected Bill Routes

router.post("/", protect, createBill);

router.get("/", protect, getBills);

router.get("/:id", protect, getBillById);

router.get("/pdf/:id", protect, generateBillPDF);


module.exports = router;