const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../Utils/fileUpload");
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: "dh4vbnhxm",
  api_key: "659545259746955",
  api_secret: "_2riwnBvl3hvR81jH88StvmqIgA"
});
const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  //validation
  if (!name || !category || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill in All the fields");
  }
  let fileData = {};
  if (req.file) {
    //Manage Image
        let uploadedImage;
    try {
       uploadedImage= await cloudinary.uploader.upload(req.file.path,{folder:"Pinvent App",resource_type: "image"})
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be Uploaded.");
    }
    fileData = {
    fileName : req.file.originalname,
    filePath : uploadedImage.secure_url,
    fileType : req.file.mimetype,
    fileSize : fileSizeFormatter(req.file.size),
    }
  }
  //Create Product
  const product = await Product.create({
    user : req.user._id,
    name,
    category,
    quantity,
    price,
    description,
    image : fileData
  })
  res.status(200).json(product);
});

//Get All the Products
const getProducts = asyncHandler(async(req,res)=>{
    const products = await Product.find({user: req.user._id}).sort("-createdAt");
    res.status(200).json(products);
})

//Get one Product
const getProduct = asyncHandler(async(req,res)=>{
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not Authorized.");
  }
  res.status(200).json(product);
})

//Delete Products
const deleteProduct = asyncHandler(async (req,res)=>{
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not Authorized.");
  }
  await product.deleteOne();
  res.status(200).json({message: "Product Deleted Successfully!"});  
})

//Update a Product
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, description } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found.");
  }
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not Authorized.");
  }  
  let fileData = {};
  if (req.file) {
    //Manage Image
        let uploadedImage;
    try {
       uploadedImage= await cloudinary.uploader.upload(req.file.path,{folder:"Pinvent App",resource_type: "image"})
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be Uploaded.");
    }
    fileData = {
    fileName : req.file.originalname,
    filePath : uploadedImage.secure_url,
    fileType : req.file.mimetype,
    fileSize : fileSizeFormatter(req.file.size),
    }
  }
  //Create Product
  const updatedProduct = await Product.findByIdAndUpdate({_id:req.params.id},{
    name,
    category,
    quantity,
    price,
    description,
    image : Object.keys(fileData).length === 0 ?  product?.image : fileData
  },
  {
    new:true,
    runValidators:true
  })
  res.status(200).json(updatedProduct);
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct
};
