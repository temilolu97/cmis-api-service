const prisma = require('../prisma/client')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { createWallet } = require('./walletController')
const registerClub = async (req, res) => {
    const { email, teamName, password, cpassword} = req.body
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        if(password != cpassword) throw new Error("Passwords do not match")
        const teamExists = await prisma.team.findFirst({
            where: {
                OR: [
                    { email: email },
                    { clubName: teamName }
                ]
            }
        })

        if (teamExists) throw new Error("A user already exists with these details")
        const team = await prisma.team.create({
            data: {
                clubName: teamName,
                email: email,
                password: hashedPassword,
            }
        })
        console.log(team, hashedPassword);
        const defaultRole = await prisma.role.findFirst({
            where: {
                roleName: 'Super Admin',
                teamId: 0
            }
        })
        console.log(defaultRole);

        const user = await prisma.user.create({
            data: {
                firstName: "Super",
                lastName: "Admin",
                email: email,
                password: hashedPassword,
                teamId: team.id,
                roleId: defaultRole.id
            }
        })

        console.log(user);
        //create team wallet
        await prisma.wallets.create({
            data:{
                clubid:team.id,
                availableBalance: 0,
                ledgerBalance: 0,
                currency: "NGN",
                dateCreated: new Date()
            }
        })


        res.status(201).json({
            message: "Registration completed successfully. Please check your email to verify your account and login",
            status: "success",
            statusCode: "00",
            data: null
        });
    } catch (error) {
        res.status(400).json({
            error: error.message,
            message: "Unable to create a new team",
            statusCode: "99"
        });
    }
}

const login = async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) throw new Error("No user exists with this email")
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) throw new Error('Incorrect password')
        const clubDetails = await prisma.team.findFirst({ where: { id: user.teamId } })
        user.clubDetails = clubDetails
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ message:"Logged in successfully",token, user })
    }
    catch (error) {
        res.status(400).json({
            error: error.message,
            message:"Unable to login",
            statusCode:"99"
        })
    }
}

const getProfile = async (req, res) => {
    const userId = req.userId
    const user = await prisma.user.findFirst({
        where: {
            id: userId
        }
    })
    const team = await prisma.team.findFirst({
        where:{
            id:user.teamId
        }
    })

     user.teamName = team.clubName
    return res.status(200).json({
        statusCode: "00",
        message: "User details fetched successfully",
        data: user
    })
}

module.exports = {
    registerClub,
    login,
    getProfile
}