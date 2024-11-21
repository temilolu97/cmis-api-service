const upload = require('../helpers/fileUpload');
const { getCustomerId } = require('../helpers/utils');
const prisma = require('../prisma/client');
const { getProfile } = require('./authController');
const { getUserDetails } = require('./userController');
const cloudinary = require('../helpers/cloudinary')



// Helper to get user by req.userId
const getUser = async (userId) => {
    return await prisma.user.findFirst({
        where: { id: userId }
    });
};

const getTeamEmployees = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        const users = await prisma.user.findMany({
            where: {
                teamId: user.teamId
            },
            include: { team: true }
        });
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

const getAllPlayers = async (req, res) => {
    try {
        const { position } = req.query
        const user = await getUser(req.userId);
        if (!user) {
            return res.status(404).json({
                statusCode: "99",
                message: "You are currently logged out, you need to login again",
                data: []
            });
        }

        const players = await prisma.player.findMany({
            where: {
                teamId: user.teamId,
                position: position
            }
        });

        res.status(200).json({
            statusCode: "00",
            message: "Player data fetched successfully",
            data: players
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
};

const getPlayerDetails = async (req, res) => {
    try {
        const playerId = parseInt(req.params.id);
        const user = await getUser(req.userId)
        const player = await prisma.player.findUnique({
            where: {
                id: playerId,
                teamId: user.teamId
            }
        });

        res.status(200).json({
            message: "Player details fetched successfully",
            status: "success",
            statusCode: "00",
            data: player
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to fetch player details',
            message: "Could not fetch player details",
            status: "failed",
            statusCode: "99"
        });
    }
};

// const addNewPlayer = async (req, res) => {
//     try {
//         const { firstName, lastName, position, squadNumber } = req.body;
//         const user = await getUser(req.userId);
//         if (!user) {
//             return res.status(404).json({
//                 statusCode: "99",
//                 message: "User not found",
//             });
//         }

//         const imageLink = req.file ? req.file.path : null;
//         console.log(imageLink);


//         const player = await prisma.player.create({
//             data: {
//                 firstName,
//                 lastName,
//                 teamId: user.teamId,
//                 position,
//                 squadNumber,
//                 imageLink,
//                 teamId: user.teamId
//             },
//         });

//         res.status(201).json({
//             statusCode: "00",
//             message: "Player added successfully",
//             data: player
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             error: 'Failed to create player',
//             statusCode: "99",
//             message: 'An error occurred while adding the player'
//         });
//     }
// };

const addNewPlayer = async (req, res) => {
    try {


        const { firstName, lastName, position, squadNumber, dob, dateJoined, annualSalary, contractExpiryDate } = req.body;
        const user = await getUser(req.userId);
        console.log(req.file);
        

        if (!user) {
            return res.status(404).json({
                statusCode: "99",
                message: "User not found",
            });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        

        let link = await uploadToCloudinary(req.file.buffer);
        const player = await prisma.player.create({
            data: {
                firstName,
                lastName,
                teamId: user.teamId,
                position,
                squadNumber,
                dateJoined: dateJoined,
                dateOfBirth:dob,
                annualSalary:parseFloat(annualSalary),
                contractExpiryDate:contractExpiryDate,
                imageLink: link,
            },
        });

        res.status(201).json({
            statusCode: "00",
            message: "Player added successfully",
            data: player
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to create player',
            statusCode: "99",
            message: 'An error occurred while adding the player'
        });
    }
};

const getFanRegistrationLink = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        const linkDetails = await prisma.fanRegistrationLinks.findFirst({
            where:{
                clubId:user.teamId,
                isActive:true
            }
        })

        const link = linkDetails.registrationLink
        return res.status(200).json({
            message:"Link fetched successfully",
            data:link
        })
    }
    catch (err) {
        res.status(500).json({
            error: err.message,
            message: "Could not fetch link",
            status: "failed",
            statusCode: "99"
        });
    }


}

const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'cmis/uploads' },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.secure_url);  // Return the URL of the uploaded image
                }
            }
        );
        stream.end(fileBuffer);  // Send the file buffer to the upload stream
    });
};


module.exports = {
    getTeamEmployees,
    getAllPlayers,
    addNewPlayer,
    getPlayerDetails,
    getFanRegistrationLink,
    uploadToCloudinary
};
