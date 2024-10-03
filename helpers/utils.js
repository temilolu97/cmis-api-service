const multer = require("multer");
const prisma = require("../prisma/client");

const getCustomerId =(req)=>{
    const id = req.userId
    return id
}


const getUser = async (userId) => {
    return await prisma.user.findFirst({
        where: { id: userId }
    });
};

const verifyToken = async (token) => {
    const inviteToken = await prisma.inviteTokens.findFirst({
        where: {
            token,
            expiresAt: {
                gte: new Date() 
            }
        }
    });

    if (!inviteToken) {
        throw new Error("Invalid or expired token");
    }

    // Return the userId to use in the `acceptInvite` function
    return { userId: inviteToken.userId };
};


module.exports={
    getCustomerId,
    getUser,
    verifyToken
}