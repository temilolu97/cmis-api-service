const jwt = require('jsonwebtoken')

module.exports = function (req, res, next) {
    try {
        console.log(req.headers);
        
        const token = req.headers['authorization'].split(' ')[1]
        
        if (!token) {
            return res.status(401).json({ message: 'You have previously logged out.Kindly login again' });
        }

        // Verify token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decoded);
            
            req.userId = decoded.userId;
            
            next();
        } catch (err) {
            res.status(401).json({ message: 'Token is not valid' });
        }
    }
    catch(err){
        res.status(401).json({
            status:"failed",
            statusCode:"99",
            message:"No token passed in the request header"
        })
    }
}