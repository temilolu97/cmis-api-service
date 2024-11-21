const { getUser } = require("../helpers/utils")
const prisma = require("../prisma/client")

const createWallet = async (req, res) => {
    try {
        const { currency } = req.body
        const user = await getUser(req.userId)
        const wallet = await prisma.wallets.create({
            data: {
                clubid: user.teamId,
                availableBalance: 0,
                ledgerBalance: 0,
                currency: currency,
                dateCreated: new Date()
            }
        })

        return res.status(201).json({
            message: "Wallet created successfully",
            data: wallet
        })

    }
    catch (err) {
        res.status(500).json({
            error: err.message,
            message: "Could not create wallet",
            status: "failed",
            statusCode: "99"
        });
    }
}

const getClubWallet = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        const wallet = await prisma.wallets.findFirst({
            where: {
                clubid: user.teamId
            }
        })

        return res.status(200).json({
            message: "Wallet created successfully",
            data: wallet
        })

    }
    catch (err) {
        res.status(500).json({
            error: err.message,
            message: "Could not retrieve wallet",
            status: "failed",
            statusCode: "99"
        });
    }
}

const getFinancialRecords = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        const incomes = await prisma.transactions.findMany({
            where: {
                teamId: user.teamId,
                direction: "C",
                transactionStatus: "success"
            }
        })
        const spendings = await prisma.transactions.findMany({
            where: {
                teamId: user.teamId,
                direction: "D",
                transactionStatus: "success"
            }
        })
        
        let revenue = 0
        let expenses = 0 
        if (incomes.length > 0) {
            incomes.forEach(item => {
                revenue += item.transactionAmount;
            });
        }
        if (expenses.length > 0) {
            expenses.forEach(item => {
                expenses += item.transactionAmount;
            });
        }

        return res.status(200).json({
            message: "Financial records fetched ",
            data: {
                revenue:revenue,
                expenses
            }
        })
        
    } catch (err) {
        res.status(500).json({
            error: err.message,
            message: "Could not retrieve wallet",
            status: "failed",
            statusCode: "99"
        });
    }
}
module.exports = {
    createWallet,
    getClubWallet,
    getFinancialRecords
}