const { verifyToken } = require('../helpers/utils');
const prisma = require('../prisma/client');
const crypto = require('crypto');
const bcrypt = require('bcrypt')




// Helper to get user by req.userId
const getUser = async (userId) => {
    return await prisma.user.findFirst({
        where: { id: userId }
    });
};

const inviteNewEmployee = async (req, res) => {
    try {

        const user = await getUser(req.userId)
        const { firstName, lastName, emailAddress, roleId } = req.body
        const userInfo = await prisma.user.findFirst({
            where: {
                email: emailAddress
            }
        })
        console.log(userInfo);

        // if (user.roleId != 1) throw new Error("You do not have access to this resource")
        if (userInfo) throw new Error("User already exists")
        const employee = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email: emailAddress,
                password: null,
                roleId: roleId,
                teamId: user.teamId
            }
        })

        const token = crypto.randomBytes(32).toString('hex');

        await prisma.inviteTokens.create({
            data: {
                token,
                userId: employee.id,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
            }
        })
        const inviteLink = `https://your-app.com/accept-invite?token=${token}`;

        //todo: implement email sendig for customer to set up password
        return res.status(201).json({
            message: "Employee invited successfully",
            status: "success",
            statusCode: "00",
            data: employee
        })
    }
    catch (err) {
        console.log(err);

        return res.status(500).json({
            error: err.message,
            message: "Could not create a new employee",
            status: "failed",
            statusCode: "99"
        })
    }

}
const acceptInvite = async (req, res) => {
    try {
        const { token } = req.query
        const { password, cpassword } = req.body

        if (!token) throw new Error("Token is required")

        const payload = await verifyToken(token);
        
        if (!payload) throw new Error("Invalid or expired token")

        const user = await prisma.user.findFirst({
            where: { id: payload.userId }
        });        

        if (!user) throw new Error('User not found')
        if (password != cpassword) throw new Error("Your passwords do not match")
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);
        
        let userInfor = await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return res.status(200).json({
            message: "Password set successfully",
            status: "success",
            statusCode: "00",
            data:userInfor
        });
    }
    catch(err){
        return res.status(500).json({
            error: err.message,
            message: err.message,
            status: "failed",
            statusCode: "99"
        })
    }
    
}
const getEmployees = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        const employees = await prisma.user.findMany({
            where: {
                teamId: user.teamId,
                roleId: {
                    not: 1
                }
            },
            include:{
                role:true
            }
        })
        return res.status(200).json({
            message: "Employees fetched successfully",
            status: "success",
            statusCode: "00",
            data: employees
        })
    }
    catch (err) {
        return res.status(500).json({
            error: err.message,
            message: "Could not fetch employees",
            status: "failed",
            statusCode: "99"
        })
    }
}

module.exports = {
    inviteNewEmployee,
    getEmployees,
    acceptInvite
}