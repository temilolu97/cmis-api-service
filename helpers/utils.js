const multer = require("multer");
const prisma = require("../prisma/client");
const { default: axios } = require("axios");

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

const frontendUrl = () =>{
    return 'http://localhost:5173'
}

const initializePayment = async (email, amount, callbackUrl, reference) => {
    const baseUrl = 'https://api.budpay.com/api/v2/transaction/initialize';
    const payload = {
        amount:amount.toString(),
        callback: callbackUrl,
        email,
        reference:reference
    };
    const headers = {
        Authorization: `Bearer sk_test_ch7lxmygafdaswmxih15xinzwtzo2ak8jxmn4ra`, 
        'Content-Type': 'application/json',
    };

    try {
        const response = await axios.post(baseUrl, payload, { headers });
        console.log("Payment initialization response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error initializing payment:", error.response ? error.response.data : error.message);
        throw new Error("Payment initialization failed");
    }
};

function generateTransactionReference() {
    const timestamp = Date.now().toString(); // Get current timestamp
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase(); // Generate a random alphanumeric string
    return `TX-${timestamp}-${randomString}`;
}

module.exports={
    getCustomerId,
    getUser,
    verifyToken,
    frontendUrl,
    initializePayment,
    generateTransactionReference
}