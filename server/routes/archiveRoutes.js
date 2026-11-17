const express = require("express");

const router = express.Router();

const { getArchivedBills } = require("../controllers/archiveController");
const protect = require("../middleware/authMiddleware");

router.get("/", protect, getArchivedBills);

module.exports = router;