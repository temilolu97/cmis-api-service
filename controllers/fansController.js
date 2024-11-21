const { getUser, initializePayment, generateTransactionReference, frontendUrl } = require("../helpers/utils")
const prisma = require("../prisma/client")
const crypto = require('crypto');

const generateRandomToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};


const registerFans = async (req, res) => {
    try {
        const { firstName, lastName, emailAddress, token, categoryId, amount } = req.body
        const fan = await prisma.fan.findFirst({
            where:{
                emailAddress:emailAddress,
            }
        })
        if(fan) throw new Error("You have previously registered with this email")
        const registrationLinkDetails = await prisma.fanRegistrationLinks.findFirst({
            where: {
                token: token
            }
        })
        const categoryDetails = await prisma.fanCategories.findFirst({
            where: {
                id: parseInt(categoryId)
            }
        })
        const reference = generateTransactionReference()
        //create payment link
        const payment = await initializePayment(emailAddress, amount, `${frontendUrl()}/payment-status?type=fan`, reference)
        console.log(payment);

        const transaction = await prisma.transactions.create({
            data: {
                transactionReference: reference,
                teamId: registrationLinkDetails.clubId,
                direction: "C",
                transactionStatus: "New",
                dateCreated: new Date(),
                transactionType: "Fan Registration",
                transactionAmount: amount
            }
        })
        console.log(transaction);

        const fanpayments = await prisma.fanRegistrationPayments.create({
            data: {
                firstName,
                lastName,
                emailAddress,
                clubId: registrationLinkDetails.clubId,
                amount: parseFloat(amount),
                status: "Initiated",
                transactionReference: reference,
                categoryId: parseInt(categoryId),
                dateCreated: new Date()
            }
        })


        // const fan = await prisma.fan.create({
        //     data: {
        //         firstName,
        //         lastName,
        //         emailAddress,
        //         clubId: parseInt(registrationLinkDetails.clubId),
        //         fanCategoryId: parseInt(categoryId)
        //     }
        // })

        return res.status(201).json({
            statusCode: "00",
            message: `Payment process for ${categoryDetails.categoryName} initiated successfully`,
            data: { payment, category: categoryDetails.categoryName }
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

const completeFanRegistration = async (req, res) => {
    const { reference, status } = req.body;

    try {
        const payment = await prisma.fanRegistrationPayments.findFirst({
            where: { transactionReference: reference },
        });
        if (!payment) throw new Error("No transaction with this reference exists");

        await prisma.$transaction(async (prisma) => {
            // Update payment status
            await prisma.fanRegistrationPayments.update({
                where: { id: payment.id },
                data: {
                    status: status,
                    dateUpdated: new Date(),
                },
            });

            // Update transaction status
            await prisma.transactions.update({
                where: { transactionReference: reference },
                data: { transactionStatus: status },
            });

            if (status === "success") {
                // Update wallet balance
                const wallet = await prisma.wallets.findFirst({
                    where: { clubid: payment.clubId },
                });

                let newBalance = wallet.availableBalance + payment.amount;

                await prisma.wallets.update({
                    where: { id: wallet.id },
                    data: { availableBalance: newBalance },
                });

                // Create a new fan if not already created
                const existingFan = await prisma.fan.findFirst({
                    where: {
                        emailAddress: payment.emailAddress,
                        clubId: payment.clubId,
                    },
                });

                    await prisma.fan.create({
                        data: {
                            firstName: payment.firstName,
                            lastName: payment.lastName,
                            emailAddress: payment.emailAddress,
                            clubId: payment.clubId,
                            fanCategoryId: payment.categoryId,
                        },
                    });
                
            }
        });

        return res.status(201).json({
            statusCode: "00",
            message: "Details updated successfully",
            data: null,
        });
    } catch (err) {
        return res.status(500).json({
            error: err.message,
            message: "Failed to update details",
            status: "failed",
            statusCode: "99",
        });
    }
};


const getAllFansByClubId = async (req, res) => {
    try {
        const user = await getUser(req.userId)

        if (!user) throw new Error("Invalid user");
        const fans = await prisma.fan.findMany({
            where: {
                clubId: user.teamId
            }
        })
        // Use Promise.all to wait for all asynchronous operations
        const fansWithCategories = await Promise.all(fans.map(async (fan) => {
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

        return res.status(201).json({
            statusCode: "00",
            message: "Fans fetched successfully",
            data: fansWithCategories
        });
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

const generateRegistrationLink = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        //check if a link exists for this club
        const link = await prisma.fanRegistrationLinks.findFirst({
            where: {
                clubId: user.teamId,
                isActive: true
            }
        })

        if (link) {
            await prisma.fanRegistrationLinks.update({
                where: {
                    id: link.id
                },
                data: {
                    isActive: false,
                    dateUpdated: new Date()
                }
            })

        }
        const token = generateRandomToken(15)
        const newLink = await prisma.fanRegistrationLinks.create({
            data: {
                clubId: user.teamId,
                registrationLink: `http://localhost:5173/fans/registration/${token}`,
                token: token,
                isActive: true,
                dateCreated: new Date(),
                dateUpdated: new Date(),
            },
        });

        return res.status(200).json({
            message: 'New registration link generated successfully',
            link: newLink.link,
        });
    }
    catch (err) {
        res.status(500).json({
            error: err.message,
            message: "Could not generate a new link",
            status: "failed",
            statusCode: "99"
        });
    }

}

const createFanCategories = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        const { categoryName, price } = req.body
        const category = await prisma.fanCategories.create({
            data: {
                categoryName: categoryName,
                ticketPrice: parseFloat(price),
                clubId: user.teamId,
                dateCreated: new Date()
            }
        })
        return res.status(200).json({
            message: 'Category created successfully',
            data: category
        });
    }
    catch (err) {
        res.status(500).json({
            error: err.message,
            message: "Could not create fans category",
            status: "failed",
            statusCode: "99"
        });
    }

}

const getFanCategories = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        const categories = await prisma.fanCategories.findMany({
            where: {
                clubId: user.teamId,
                dateDeleted: null
            }
        })
        return res.status(200).json({
            message: 'Categories fetched successfully',
            data: categories
        });
    }
    catch (err) {
        res.status(500).json({
            error: err.message,
            message: "Could not create fans category",
            status: "failed",
            statusCode: "99"
        });
    }
}

const getCategoriesForFans = async (req, res) => {
    try {
        const { token } = req.query
        console.log(token);

        const link = await prisma.fanRegistrationLinks.findFirst({
            where: {
                token: token
            }
        })
        console.log(link);

        const categories = await prisma.fanCategories.findMany({
            where: {
                clubId: link.clubId
            }
        })
        console.log(categories);

        return res.status(200).json({
            message: 'Categories fetched successfully',
            data: categories
        });
    }
    catch (err) {
        res.status(500).json({
            error: err.message,
            message: "Could not create fans category",
            status: "failed",
            statusCode: "99"
        });
    }
}

const updateFanCategory = async (req, res) => {
    try {
        const { id } = req.params
        const categoryId = parseInt(id)
        const { categoryName, ticketPrice } = req.body
        const user = await getUser(req.userId)
        const category = await prisma.fanCategories.findFirst({
            where: {
                id: categoryId
            }
        })
        if (!category) throw new Error("No category exists with this Id")
        if (category.clubId !== user.teamId) throw new Error("You do not have access to this resource")
        const updatedCategory = await prisma.fanCategories.update({
            where: {
                id: categoryId
            },
            data: {
                categoryName: categoryName ? categoryName : category.categoryName,
                ticketPrice: ticketPrice ? parseFloat(ticketPrice) : category.ticketPrice,
                dateUpdated: new Date()
            }
        })
        return res.status(200).json({
            message: `Category with id ${categoryId} successfully`,
            data: updatedCategory
        });
    }
    catch (err) {
        res.status(500).json({
            error: err.message,
            message: "Could not update fans category",
            status: "failed",
            statusCode: "99"
        });
    }
}

const deleteCategory = async (req, res) => {
    try {
        const user = await getUser(req.userId)
        const { categoryId } = req.params
        console.log(categoryId);
        
        const category = await prisma.fanCategories.findFirst({
            where: {
                id: parseInt(categoryId),
                clubId: user.teamId,
            }
        })
        if (category.dateDeleted != null) throw new Error("Category has been previously deleted")
        await prisma.fanCategories.update({
            where: {
                id: category.id
            },
            data:{
                dateDeleted:new Date()
            }
        })
        return res.status(200).json({
            message:"Category deleted successfully",
            data:null
        })
    }
    catch(err){
        res.status(500).json({
            error: err.message,
            message: "Could not delete category",
            status: "failed",
            statusCode: "99"
        });
    }
    

}

module.exports = {
    registerFans,
    getAllFansByClubId,
    generateRegistrationLink,
    createFanCategories,
    getFanCategories,
    updateFanCategory,
    getCategoriesForFans,
    completeFanRegistration,
    deleteCategory
}