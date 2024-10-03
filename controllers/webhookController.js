const prisma = require("../prisma/client")

const receiveBudpayHook =async(req,res)=>{
    const {data} = req.body
    //get payment details by reference
    const registrationInfo = await prisma.eventRegistration.findFirst({
        where:{
            paymentReference:data.reference
        }
    })
    if(!registrationInfo) return

    const eventId = registrationInfo.eventId
    const eventInfo = await prisma.event.findFirst({
        where:{
            id:eventId
        }
    })
    if(data.amount != eventInfo.registrationFee) return
    if(data.status=='success' && data.message =="Approved"){
        await prisma.eventRegistration.update({
            where:{
                id:registrationInfo.id
            },
            data:{
                paid:true
            }
        })
        return res.status(200).json({
            message:"Hook received"
        })
    }
    return
}

module.exports ={
    receiveBudpayHook
}