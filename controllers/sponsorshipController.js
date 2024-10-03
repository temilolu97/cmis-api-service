const { getUser } = require('../helpers/utils');
const prisma = require('../prisma/client');
const getSponsors = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        if (!user) throw new Error("Invalid token supplied");
        const sponsors = await prisma.sponsorship.findMany({
            where: {
                teamId: user.teamId
            }
        })
        return res.status(200).json({
            statusCode: "00",
            message: "Sponsors fetched successfully",
            data: sponsors
        })
    }
    catch (err) {
        res.status(500).json({
            error: err.message,
            message: "Failed to fetch all sponsors",
            status: "failed",
            statusCode: "99"
        });
    }
    
}

const addNewSponsors = async(req,res) =>{
    
}

module.exports ={
    getSponsors
}