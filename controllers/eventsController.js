const { default: axios } = require("axios");
const { getUser } = require("../helpers/utils")
const prisma = require("../prisma/client")
const crypto = require('crypto')

const generateRegistrationLink = (eventId) => {
    const token = crypto.randomBytes(8).toString('hex');
    return `https://localhost:3000/events/${eventId}/register/${token}`; // Adjust the base URL
};

//initialize payment
const initializePayment = async (email, amount, callbackUrl) => {
    const baseUrl = 'https://api.budpay.com/api/v2/transaction/initialize';
    const payload = {
        amount:amount.toString(),
        callback: callbackUrl,
        email,
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

//create organization event
const createNewEvent = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        const { eventName, eventType, eventDate, eventLocation, eventDescription, matchType, opponent, requiresPayment, fee } = req.body

        const homeTeamLogoUrl = req.files['homeTeamLogo'] ? req.files['homeTeamLogo'][0].path : '';
        const awayTeamLogoUrl = req.files['awayTeamLogo'] ? req.files['awayTeamLogo'][0].path : '';

        const team = await prisma.team.findFirst({
            where: {
                id: user.teamId
            }
        })
        const event = await prisma.event.create({
            data: {
                name: eventName,
                type: eventType,
                date: eventDate,
                location: eventLocation,
                description: eventDescription,
                createdAt: new Date(),
                createdBy: user.id,
                teamId: user.teamId,
                requiresPayment: JSON.parse(requiresPayment),
                registrationFee: parseFloat(fee),
                ...(eventType === "MATCH" && {
                    match: {
                        create: {
                            homeTeam: team.clubName,
                            opponent: opponent,
                            matchType: matchType,
                            homeTeamLogoUrl: homeTeamLogoUrl,
                            awayTeamLogoUrl: awayTeamLogoUrl
                        }
                    }
                })

            }
        })

        const registrationLink = generateRegistrationLink(event.id);

        await prisma.event.update({
            where: {
                id: event.id
            },
            data: {
                registrationLink: registrationLink
            }
        })

        return res.status(200).json({
            message: "Event successfully created",
            status: "success",
            statusCode: "00",
            data: { ...event, registrationLink }
        })
    }
    catch (err) {
        return res.status(500).json({
            error: err.message,
            message: "Could not create a new employee",
            status: "failed",
            statusCode: "99"
        })
    }
}
//get all events of an organization

const getAllEvents = async (req, res) => {
    try {
        const { type } = req.query
        const user = await getUser(req.userId)
        const events = await prisma.event.findMany({
            where: {
                teamId: user.teamId,
                ...(type !== 'All' && type ? { type: type.toUpperCase() } : {})
            }
        })

        return res.status(200).json({
            message: "Event fetched successfully",
            status: "success",
            statusCode: "00",
            data: events
        })
    }
    catch (err) {
        return res.status(500).json({
            error: err.message,
            message: "Could not fetch events",
            status: "failed",
            statusCode: "99"
        })
    }
}

//register for event
const getEventDetails = async (req, res) => {
    try {
        const { eventId } = req.params
        const { link } = req.body
        console.log(eventId);


        const event = await prisma.event.findFirst({
            where: {
                id: parseInt(eventId),
                registrationLink: link
            }
        })
        if (!event) {
            return res.status(404).json({
                message: "Event not found",
                status: "failed",
                statusCode: "404",
                data: null
            })
        }
        return res.status(200).json({
            message: "Event details fetched successfully",
            status: "success",
            statusCode: "00",
            data: event
        })
    }
    catch (err) {
        return res.status(500).json({
            error: err.message,
            message: "Could not fetch event details",
            status: "failed",
            statusCode: "99"
        })
    }

}
//
const eventRegistration = async (req, res) => {
    try {
        const { firstName, lastName, email, eventId } = req.body
        const event = await prisma.event.findFirst({
            where: {
                id: eventId
            }
        })

        if (!event) throw new Error("Event Id not found");

        console.log(event);
        
        if(event.requiresPayment){
            
            var transaction = await initializePayment(email, event.registrationFee, "https://localhost:3000")
            
            const registration= await prisma.eventRegistration.create({
                data:{
                    firstName,
                    lastName,
                    email,
                    eventId:eventId,
                    paid:false,
                    paymentLink:transaction.data.authorization_url,
                    paymentReference:transaction.data.reference
                }
            })
            return res.status(201).json({
                message: "Registration created, please complete payment",
                status: "success",
                statusCode: "00",
                paymentLink:transaction.data.authorization_url
            })
        }
        else{
            const registration = await prisma.eventRegistration.create({
                data:{
                    firstName,
                    lastName,
                    email,
                    eventId:eventId,
                    paid:false
                }
            })
            return res.status(201).json({
                message: "Successfully registered for the event",
                status: "success",
                statusCode: "00",
                data: registration
            });
        }

        
    }
    catch (err) {
        return res.status(500).json({
            error: err.message,
            message:"Event registration could not be completed",
            status: "failed",
            statusCode: "99"
        })
    }


}
//get single event of an organization

module.exports = {
    createNewEvent,
    getAllEvents,
    getEventDetails,
    eventRegistration
}