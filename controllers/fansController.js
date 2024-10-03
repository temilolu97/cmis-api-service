const { getUser } = require("../helpers/utils")
const prisma = require("../prisma/client")

const registerFans = async (req, res) => {
    try {
        const { firstName, lastName, emailAddress, clubId } = req.body
        const team = await prisma.team.findFirst({
            where: {
                id: clubId
            }
        })
        if (!team) throw new Error("No team with the passed Id exists")
        const fan = await prisma.fan.create({
            data: {
                firstName,
                lastName,
                emailAddress,
                clubId: clubId
            }
        })

        return res.status(201).json({
            statusCode: "00",
            message: "Fan registration successful",
            data: fan
        })
    }
    catch (err) {
        res.status(500).json({
            error: err.message,
            message: "Fan registration failed",
            status: "failed",
            statusCode: "99"
        });
    }
}

const getAllFansByClubId = async (req, res) => {
    try {
        const user = await getUser(req.userId)        

        if (!user) throw new Error("Invalid user");
        const fans = await prisma.fan.findMany({
            where: {
                clubId: user.teamId
            }
        })
        return res.status(201).json({
            statusCode: "00",
            message: "Fans fetched successfully",
            data: fans
        })
    }
    catch (err) {
        res.status(500).json({
            error: err.message,
            message: "Failed to fetch fans",
            status: "failed",
            statusCode: "99"
        });
    }
    
}

module.exports = {
    registerFans,
    getAllFansByClubId
}