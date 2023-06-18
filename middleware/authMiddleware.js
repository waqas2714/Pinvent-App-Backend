const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const protect = asyncHandler(async (req, res, next)=>{
    try {
        const token = req.cookies.Token;
        if (!token) {
            res.status(401);
            throw new Error("Not Authorized. PLease login Again.");
        }
        const verified = jwt.verify(token,process.env.JWT_SECRET);
        //Find User by ID after getting the id from verified
        const user = await User.findById(verified.id).select("-password");
        if (!user) {
            res.status(401);
            throw new Error("User Not Found."); 
        }
        req.user = user;
        next();
    } 
    catch (err) {
        res.status(401).json({error:err.message});
    }
})


module.exports = protect