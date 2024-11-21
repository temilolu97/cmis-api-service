const { default: axios } = require("axios");
const { getUser, initializePayment, frontendUrl } = require("../helpers/utils")
const prisma = require("../prisma/client")
const crypto = require('crypto');
const { uploadToCloudinary } = require("./teamController");

const generateRegistrationLink = (eventId) => {
    const token = crypto.randomBytes(8).toString('hex');
    return `${frontendUrl()}/events/${eventId}/register/${token}`; // Adjust the base URL
};

//initialize payment


//create organization event
const createNewEvent = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        const { eventName, eventType, eventDate, eventLocation, eventDescription, matchType, opponent, requiresPayment, fee } = req.body

        const homeTeamLogo = req.files['homeTeamLogo'] ? req.files['homeTeamLogo'][0] : null;
        const awayTeamLogo = req.files['awayTeamLogo'] ? req.files['awayTeamLogo'][0] : null;

        let homeTeamLogoUrl = '';
        let awayTeamLogoUrl = '';
        console.log(homeTeamLogo, awayTeamLogo);

        // Only upload if file exists
        if (homeTeamLogo) {
            homeTeamLogoUrl = await uploadToCloudinary(homeTeamLogo.buffer);
        }
        if (awayTeamLogo) {
            awayTeamLogoUrl = await uploadToCloudinary(awayTeamLogo.buffer);
        };
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
            message: "Could not create a new event",
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
        const eventsWithMatchData = await Promise.all(
            events.map(async (event) => {
                if (event.type === "MATCH") {
                    const matchData = await prisma.match.findFirst({
                        where: { eventId: event.id }
                    });
                    event.match = matchData;
                }
                return event;
            })
        );


        return res.status(200).json({
            message: "Event fetched successfully",
            status: "success",
            statusCode: "00",
            data: eventsWithMatchData
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
        const eventReg = await prisma.eventRegistration.findFirst({
            where: {
                email: email,
                paid: true,
                eventId:eventId
            }
        })
        if (eventReg) throw ("You have previously successfully registered for this event")
        if (!event) throw new Error("Event Id not found");

        console.log(event);

        if (event.requiresPayment) {

            var transaction = await initializePayment(email, event.registrationFee, `${frontendUrl()}/payment-status?type=event`)
            //log transaction details
            const details = await prisma.transactions.create({
                data: {
                    transactionType: "Events Payment",
                    transactionReference: transaction.data.reference,
                    transactionStatus: "New",
                    teamId: event.teamId,
                    transactionAmount: event.registrationFee,
                    direction: "C"
                }
            })
            const registration = await prisma.eventRegistration.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    eventId: parseInt(eventId),
                    paid: false,
                    paymentLink: transaction.data.authorization_url,
                    paymentReference: transaction.data.reference
                }
            })

            return res.status(201).json({
                message: "Registration initiated, please complete payment",
                status: "success",
                statusCode: "00",
                paymentLink: transaction.data.authorization_url
            })
        }
        else {
            const registration = await prisma.eventRegistration.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    eventId: eventId,
                    paid: false
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
            message: "Event registration could not be completed",
            status: "failed",
            statusCode: "99"
        })
    }


}

const completeEventRegistration = async (req, res) => {
    try {
        const { reference, status } = req.body
        //find transaction by reference
        const transaction = await prisma.transactions.findFirst({
            where: {
                transactionReference: reference
            }
        })
        if (!transaction) throw new Error("No transaction exists with this reference")


        await prisma.transactions.update({
            where: {
                transactionReference: reference
            },
            data: {
                transactionStatus: status,
                dateUpdated: new Date()
            }
        })
        if (status == "success") {
            console.log(status);
            let registration = await prisma.eventRegistration.update({
                where: {
                    paymentReference: reference
                },
                data: {
                    paid: true
                }
            })


            //fund wallet
            const wallet = await prisma.wallets.findFirst({
                where: {
                    clubid: transaction.teamId
                }
            })
            await prisma.wallets.update({
                where: {
                    id: wallet.id
                },
                data: {
                    availableBalance: wallet.availableBalance + transaction.transactionAmount
                }
            })
        }
        return res.status(200).json({
            message: "Registration completed successfully",
            data: null
        })
    }
    catch (err) {
        return res.status(500).json({
            error: err.message,
            message: "Unable to complete registration",
            status: "failed",
            statusCode: "99"
        })
    }

}

//get registrants for an event
const getEventRegistrants = async (req, res) => {
    try {
        const { eventId } = req.params
        console.log(eventId);
        
        const eventDetails = await prisma.event.findFirst({
            where: {
                id: parseInt(eventId)
            }
        })
        console.log(eventDetails);
        
        let registrants
        if (eventDetails.requiresPayment == false) {
            registrants = await prisma.eventRegistration.findMany({
                where: {
                    eventId: eventDetails.id,
                    paid: false
                }
            })
        } else {
            registrants = await prisma.eventRegistration.findMany({
                where: {
                    eventId: eventDetails.id,
                    paid: true
                }
            })
        }
        return res.status(200).json({
            message:"Registrants fetched successfully",
            data:registrants
        })
    }
    catch(err){
        return res.status(500).json({
            error: err.message,
            message: "Unable to fetch event registrants",
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
    eventRegistration,
    completeEventRegistration,
    getEventRegistrants
}