const dayjs = require('dayjs');
const { getUser } = require('../helpers/utils');
const prisma = require('../prisma/client');

const getSummary = async (req, res) => {
    //wallet balance , number of players, number of employees, number of fans, anunual salaries
    //wallet
    const user = await getUser(req.userId)
    const wallet = await prisma.wallets.findFirst({
        where: {
            clubid: user.teamId
        }
    })
    console.log(wallet);

    let walletBalance = wallet.availableBalance
    // number of players 
    const players = await prisma.player.findMany({
        where: {
            teamId: user.teamId
        }
    })
    const fans = await prisma.fan.findMany({
        where: {
            clubId: user.teamId
        }
    })
    const fanCount = fans.length
    const playerCount = players.length
    // number of employees 
    const employeeCount = await prisma.user.count({
        where: {
            teamId: user.teamId,
            roleId: {
                not: 1
            }
        }
    })
    let annualSalaries = 0;
    if (playerCount > 0) {
        annualSalaries = players.reduce((accumulator, currentValue) => accumulator + currentValue.annualSalary, 0)
        console.log(annualSalaries);
    }

    return res.status(200).json({
        message: "Metrics data fetched successfully",
        data: {
            annualSalaries,
            playerCount,
            fanCount,
            walletBalance,
            employeeCount
        }
    })
}

const getLatestTransactions = async (req, res) => {
    const user = await getUser(req.userId)
    const transactions = await prisma.transactions.findMany({
        where: {
            teamId: user.teamId
        },
        orderBy: {
            dateCreated: 'desc'
        },
        take: 10
    })
    return res.status(200).json({
        message: "Latest transactions retrieved successfully",
        data: transactions,
    });
}

const getUpcomingEvents = async (req, res) => {
    const user = await getUser(req.userId)
    const transactions = await prisma.event.findMany({
        where: {
            teamId: user.teamId
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 2
    })
    return res.status(200).json({
        message: "Get upcoming events",
        data: transactions,
    });
}

const getLatestFanRegistrations = async (req, res) => {
    const user = await getUser(req.userId)
    const registrations = await prisma.fan.findMany({
        where: {
            clubId: user.teamId
        },
        orderBy: {
            dateCreated: 'desc'
        },
        take: 5
    })
    const fansWithCategories = await Promise.all(registrations.map(async (fan) => {
        const category = await prisma.fanCategories.findFirst({
            where: {
                id: fan.fanCategoryId
            }
        });
        return {
            ...fan,
            category: category?.categoryName || null // Add category name or null if not found
        };
    }));
    return res.status(200).json({
        message: "Latest registered fans retrieved successfully",
        data: fansWithCategories,
    });
}

const getTransactionsGraphData = async (req, res) => {
    const user = await getUser(req.userId)
    const { range } = req.query;

    let startDate;

    // Determine startDate based on range
    if (range === '12months') {
        startDate = dayjs().subtract(12, 'month').toDate();
    } else if (range === '6months') {
        startDate = dayjs().subtract(6, 'month').toDate();
    } else if (range === '1month') {
        startDate = dayjs().subtract(1, 'month').toDate();
    } else if (range === '7days') {
        startDate = dayjs().subtract(7, 'day').toDate();
    }
    else if (range === '1day') {
        startDate = dayjs().subtract(1, 'day').toDate();
    } else {
        return res.status(400).json({ error: 'Invalid range' });
    }

    try {
        const inflow = await prisma.transactions.aggregate({
            _sum: {
                transactionAmount: true,
            },
            where: {
                teamId: user.teamId,
                transactionStatus: 'success',
                direction: 'C',
                dateCreated: { gte: startDate },
            },
        });

        const outflow = await prisma.transactions.aggregate({
            _sum: {
                transactionAmount: true,
            },
            where: {
                teamId: user.teamId,
                transactionStatus: 'success',
                direction: 'D',
                dateCreated: { gte: startDate },
            },
        });

        return res.json({
            message: "Data fetched successfully",
            data: {
                inflow: inflow._sum.transactionAmount || 0,
                outflow: outflow._sum.transactionAmount || 0,
            }

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const getAllTransactions = async(req,res) =>{
    try{
        const user = await getUser(req.userId)
        const transactions = await prisma.transactions.findMany({
            where:{
                teamId:user.teamId
            }
        })
        return res.status(200).json({
            message:"Transactions fetched successfully",
            data:transactions
        })
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const getFinancialSourcesSummary =async(req,res) =>{
    try{
        const user = await getUser(req.userId)
        const summary = await prisma.transactions.groupBy({
            by: ['transactionType'],
            where:{
                direction:"C",
                transactionStatus:"success",
                teamId:user.teamId
            },
            _sum: {
              transactionAmount: true,
            },
          });
      
          // Calculate total transactions amount
          const totalAmount = summary.reduce(
            (acc, item) => acc + item._sum.transactionAmount,
            0
          );
      
          // Calculate percentage contributions
          const result = summary.map((item) => ({
            transactionType: item.transactionType,
            amount:item._sum.transactionAmount,
            percentage: ((item._sum.transactionAmount / totalAmount) * 100).toFixed(2),
          }));
      
          res.status(200).json({ 
            message: "Summary retrieved successfully",
            data: result 
        });
    }
    catch(err){
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    getSummary,
    getLatestTransactions,
    getLatestFanRegistrations,
    getUpcomingEvents,
    getTransactionsGraphData,
    getAllTransactions,
    getFinancialSourcesSummary
}
