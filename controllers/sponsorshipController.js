const { getUser } = require('../helpers/utils');
const prisma = require('../prisma/client');
const { uploadToCloudinary } = require('./teamController');


function getDurationInYearsAndMonths(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();

    // Adjust if the end month is earlier than the start month
    if (months < 0) {
        years--;
        months += 12;
    }

    return `${years} years, ${months} months`;

}


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
    try{
        const user = await getUser(req.userId)
        const {sponsorName, startDate, endDate,sponsorshipType, contactPerson, sponsorshipValue } = req.body

        if (!req.file) {
            return res.status(400).json({ message: 'Sponsors logo not uploaded' });
        }

        let logoUrl = await uploadToCloudinary(req.file.buffer);
        const duration = getDurationInYearsAndMonths(startDate,endDate)
        const sponsor = await prisma.sponsorship.create({
            data: {
                sponsorName,
                contactPerson,
                duration:duration,
                startDate: new Date(startDate),  // Ensure DateTime format
                endDate: new Date(endDate), 
                sponsorLogoLink:logoUrl,
                sponsorshipType,
                teamId:user.teamId,
                sponsorshipValue: parseFloat(sponsorshipValue),
                dateCreated:new Date()
            },
        });

        res.status(201).json({
            statusCode: "00",
            message: "Sponsor added successfully",
            data: sponsor
        });
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

module.exports ={
    getSponsors,
    addNewSponsors
}