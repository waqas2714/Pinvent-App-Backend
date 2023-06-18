const errorHandler =(err,  req, res, next)=>{
    const statuscode = res.statuscode ? res.statuscode : 500;
    res.status(statuscode);
    res.json({
        message : err.message,
        stack : process.env.NODE_ENV==="development" ? err.stack : null 
    }) 
    next();
}

module.exports = errorHandler