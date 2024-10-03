const { error } = require('console');
const { getUser } = require('../helpers/utils');
const prisma = require('../prisma/client');

const getRoles = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        
        const role = await prisma.role.findMany({
            where: {
                teamId: user.teamId
            }
        })
        console.log(role);
        
        return res.status(200).json({
            message: "Roles fetched successfully",
            status: "success",
            statusCode: "00",
            data:role
        })
    }
    catch (error) {
        return res.status(400).json({
            error: 'Failed to fetch player details',
            message: "Could not fetch player details",
            status: "failed",
            statusCode: "99"
        })
    }

}

const createRole =async(req, res) =>{
    try{
        const {name } = req.body
        const user = await getUser(req.userId)
        const role = await prisma.role.create({
            data:{
                roleName: name,
                teamId:user.teamId
            }
        })

        return res.status(201).json({
            message:"Role created successfully",
            status:"success",
            statusCode:"00",
            data:role
        })
    }
    catch(err){
        return res.status(500).json({
            error:err,
            message:"Could not create role",
            status:"failed",
            statusCode:"99"
        })
    }
   
}

module.exports ={
    getRoles,
    createRole
}