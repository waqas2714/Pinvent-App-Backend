const express = require("express");
const protect = require("../middleware/authMiddleware");
const contactus = require("../controllers/contactController");
const router = express.Router();

router.post("/", protect, contactus);


module.exports = router