const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const userRoute = require("./routes/userRoute.js");
const productRoute = require("./routes/productRoute.js");
const contactRoute = require("./routes/contactRoute.js");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorMiddleware.js");
const path = require("path");
const app = express();

//MiddleWares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://p-invent-ten.vercel.app"],
    credentials: true,
  })
);
//Routing Middlewares
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/contactUs", contactRoute);
//Creating Route
app.get("/", (req, res) => {
  res.send("Home Page!");
});

//Error Middleware
app.use(errorHandler);

//Server Creation
//const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(() => {
     console.log(`Running Server`);
      console.log("MongoDB Connected!");
    });
  })
  .catch((err) => {
    console.log(err);
  });
