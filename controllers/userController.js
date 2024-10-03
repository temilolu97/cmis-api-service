const prisma = require('../prisma/client')

const getUserDetails =async(req,res)=>{
    const userId = req.userId
    const user = await prisma.user.findFirst({
        where:{
            id:userId
        }
    })
    return res.status(200).json({
        statusCode:"00",
        message:"User details fetched successfully",
        data: user
    })
}

module.exports = {
    getUserDetails
}