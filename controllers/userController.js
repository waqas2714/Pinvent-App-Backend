const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Token = require("../models/tokenModel");
const sendEmail = require("../Utils/sendEmail");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

//Register User
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  //All the Checks
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide all the credentials.");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be more than 5 characters.");
  }
  if (password.length > 20) {
    res.status(400);
    throw new Error("Password must be less than 20 characters.");
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("This email is already taken.");
  }

  //Creating a user in db
  const user = await User.create({
    name,
    email,
    password,
  });
  //Generating Token For User
  const token = generateToken(user._id);
  //Send HTTP-Only Cookie
  res.cookie("Token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 86400 * 1000),
    sameSite: "none",
    secure: true,
  });
  if (user) {
    const { name, email, password, photo, phone, bio } = user;
    res.status(201).json({ name, email, photo, phone, bio, token });
  } else {
    res.status(400);
    throw new Error("Invalid Data.");
  }
});

//Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("User not Found!");
  }
  const truePassword = await bcrypt.compare(password, user.password);
  //Generating Token For User
  const token = generateToken(user._id);
  //Send HTTP-Only Cookie
  res.cookie("Token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 86400 * 1000),
    sameSite: "none",
    secure: true,
  });
  if (user && truePassword) {
    const { name, email, photo, phone, bio } = user;
    res.status(200).json({ name, email, phone, bio, token, photo });
  } else {
    res.status(400);
    throw new Error("Invalid Email or Password.");
  }
});

//Logout
const logout = asyncHandler(async (req, res) => {
  res.cookie("Token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({
    message: "Logged out Succesfully!",
  });
});

//Get User Data
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { name, email, phone, bio, photo } = user;
    res.status(201).json({ name, email, phone, bio, photo });
  } else {
    res.status(400);
    throw new Error("User Not Found");
  }
});

//Get Login Status

const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.Token;
  if (!token) {
    res.json(false);
  }
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (!verified) {
    res.json(false);
  }
  res.json(true);
});

//Update User
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { name, email, phone, bio, photo } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.bio = req.body.bio || bio;
    user.photo = req.body.photo || photo;
    const updatedUser = await user.save();

    res.status(200).json({
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      photo: updatedUser.photo,
    });
  } else {
    res.status(400);
    throw new Error("User Not Found!");
  }
});

//Change Password
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(404);
    throw new Error("User Not Found");
  }
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please enter both new and old password.");
  }
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password Changed Successfully !!!");
  } else {
    res.status(400);
    throw new Error("Old Password is Incorrect.");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User Not Found!");
  }
  //Checking if the token already exists and deleting it in DB
  const token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }
  //Generating Token
  const resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken);

  //Hashing(Most Prolly Encrypting) the resetToken
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //New Token Object in DB
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), //30 mins
  }).save();

  //The Reset URL that'll be sent to the user
  const resetUrl = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;

  //Email Body

  const message = `
    <h2>Hello ${user.name}!</h2>
    <p>Please use the URL below to reset your password.</p>
    <p>This link is valid for only 30 minutes.</p>
    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
    <p>Regards.</p>
    <p>Pinvent Team.</p>
  `;
  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({
      success: true,
      message: "Password Reset Email Sent!",
    });
  } catch (err) {
    res.status(400);
    throw new Error("Email failed to be sent. Please try Again.");
  }
});

//Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;
  //Hashing the resetToken to compare it with theone saved in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const token = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });
  if (!token) {
    res.status(404);
    throw new Error("Token Not Found!");
  }
  const user = await User.findOne({ _id: token.userId });
  user.password = password;
  await user.save();
  res.status(200);
  throw new Error("Password Changed Successfully :)");
});

module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
