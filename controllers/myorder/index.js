const {
    mysql
} = require('../../mysql');

async function detailAction(ctx) {
    const openId = ctx.query.openId;
    const cartId = ctx.query.cartId;
    const addressId = ctx.query.addressId || '';
   
    const orderDetail = await mysql('nideshop_order').where({
        user_id: openId,
        goods_id: cartId
    }).select();

    let cartIds = orderDetail[0].goods_id.split(",");
     
    const list = await mysql('nideshop_cart').andWhere({
        user_id: openId
    }).whereIn('id', cartIds).select();

    //收货地址
    var addressList;
    if (addressId) {
        addressList = await mysql("nideshop_address")
            .where({
                user_id: openId,
                id: addressId
            }).orderBy('is_default', 'desc')
            .select();
    } else {
        addressList = await mysql("nideshop_address")
            .where({
                user_id: openId,
            }).orderBy('is_default', 'desc')
            .select();
    }


    ctx.body = {
        allPrise: orderDetail[0].allprice,
        goodsList: list,
        address: addressList[0] || {}
    }

}
async function listAction(ctx) {
    const openId = ctx.query.openId
    const status = ctx.query.status
    const params = {
        user_id: openId
    }
    status && (params.status = status)
    const orderData = await mysql('nideshop_order').where(params).select();
    const orderList = []
    for(let item of orderData) {
        const goodsIdArr = item.goods_id.split(',')
        const goodsList = await mysql('nideshop_cart').andWhere({
            user_id: openId
        }).whereIn('id', goodsIdArr).select()
        orderList.push({
            id: item.id,
            goodsList
        })
    }
    ctx.body = {
        data: orderList
    }
}
module.exports = {
    detailAction,
    listAction
}