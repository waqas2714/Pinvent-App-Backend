const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const sendEmail = require("../Utils/sendEmail");

const contactus = asyncHandler(async (req, res) => {
  const {subject, message} = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }
  const send_to = process.env.EMAIL_USER;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = user.email;
  // const send_to = user.email;
  // const sent_from = process.env.EMAIL_USER;
  // const reply_to = process.env.EMAIL_USER;
  if (!subject || !message) {
    res.status(400);
    throw new Error("Please add subject AND message.");
  }
  try {
    await sendEmail(subject, message, send_to, sent_from, reply_to);
    res.status(200).json({
      success: true,
      message: "Complain Email Sent!",
    });
  } catch (err) {
    res.status(400);
    throw new Error("Email failed to be sent. Please try Again.");
  }
});


module.exports = contactus;
