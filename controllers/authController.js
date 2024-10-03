const prisma = require('../prisma/client')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const registerClub = async (req, res) => {
    const { email, teamName, password, } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        const team = await prisma.team.create({
            data: {
                clubName: teamName,
                email: email,
                password: hashedPassword,
            }
        })
        console.log(team, hashedPassword);
        const defaultRole = await prisma.role.findFirst({
            where:{
                teamId:0
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
                roleId:defaultRole.id
            }
        })

        console.log(user);
        

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' })
        res.status(201).json({ token });
    } catch (error) {
        res.status(400).json({ error: error });
    }
}

const login = async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) throw new Error("Incorrect email")
        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) throw new Error('Incorrect password')
        const clubDetails = await prisma.team.findFirst({where:{id: user.teamId}})    
        user.clubDetails= clubDetails
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ token, user })
    }
    catch (error) {
        res.status(400).json({ error: error })
    }
}

const getProfile = async(req, res)=>{
    const userId = req.userId
    const user = await prisma.user.findFirst({
        where:{
            id:userId
        }
    })
    return res.status(200).json({
        statusCode:"00",
        message:"User details fetched successfully",
        data: user
    })
}

module.exports = {
    registerClub,
    login,
    getProfile
}