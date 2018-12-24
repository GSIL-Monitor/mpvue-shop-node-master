const {
    mysql
} = require('../../mysql')


async function detailAction(ctx) {
    const openId = ctx.query.openId;
    const orderId = ctx.query.orderId;
    let shipper = "";
    let orderStatus = "";

    const orderDetail = await mysql('nideshop_order').where({
        user_id: openId,
        id: orderId
    }).select();

    const list = await mysql('nideshop_order_goods').where({
        order_id: orderId
    }).select();

    //收货地址
   
    const express = await mysql('nideshop_order_express').where({
        order_id: orderId
    }).select();


    var addressList;
    if (express[0].address_id > 0) {
        addressList = await mysql("nideshop_address").where({
                id: express[0].address_id
        }).select();

        shipper = express[0].shipper_name+" : "+express[0].shipper_code;

    } else {
        addressList = await mysql("nideshop_address").where({
                user_id: openId,
            }).orderBy('is_default', 'desc')
            .select();
    }

    ctx.body = {
        orderTime: orderDetail[0].order_time,
        allPrise: orderDetail[0].allprice,
        goodsList: list,
        address: addressList[0] || {},
        orderStatus: orderDetail[0].status,
        shipper: shipper
    }

}




module.exports = {
    detailAction
}