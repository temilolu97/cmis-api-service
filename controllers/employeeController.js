const { verifyToken, frontendUrl, getUser } = require('../helpers/utils');
const prisma = require('../prisma/client');
const crypto = require('crypto');
const bcrypt = require('bcrypt')




// // Helper to get user by req.userId
// const getUser = async (userId) => {
//     return await prisma.user.findFirst({
//         where: { id: userId }
//     });
// };


const addEmployee = async(req, res) =>{

}

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

        const inviteLink = `${frontendUrl()}/invitation?token=${token}`;

        //todo: implement email sendig for customer to set up password
        return res.status(201).json({
            message: "Employee invited successfully",
            status: "success",
            statusCode: "00",
            data: employee,
            token,
            inviteLink
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
        const { password, cpassword, value } = req.body
        if(value == "Yes"){
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
        }else{
            return res.status(200).json({
                message: "Invite declined",
                status: "success",
                statusCode: "00",
                data:userInfor
            });
        }
        
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
        
        //get superAdminId
        const superAdmin = await prisma.role.findFirst({
            where:{
                teamId:0
            }
        })
        console.log(superAdmin);
        
        //
        const employees = await prisma.user.findMany({
            where: {
                teamId: user.teamId,
                NOT:{
                    roleId: superAdmin.id
                }
            }
        })
        const employeesWithRoles = await Promise.all(employees.map(async (employee) => {
            const role = await prisma.role.findFirst({
                where: {
                    id: employee.roleId
                }
            });
            return {
                ...employee,
                role: role?.roleName || null 
            };
        }));
        console.log(employeesWithRoles);
        
        return res.status(200).json({
            message: "Employees fetched successfully",
            status: "success",
            statusCode: "00",
            data: employeesWithRoles
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