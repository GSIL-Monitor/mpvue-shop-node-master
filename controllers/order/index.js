const {
    mysql
} = require('../../mysql');

async function submitAction(ctx) {
    const {
        openId,
    } = ctx.request.body;
    let cartId = ctx.request.body.cartId;
    let allPrise = ctx.request.body.allPrise
    //是否存在在订单
    const isOrder = await mysql('nideshop_order').where({
        user_id: openId,
        goods_id: cartId
    }).select();
    // 存在
    // var nowgoodsid = "";
    if (isOrder.length > 0) {
        //现在的goodsId加上以前的
        // goodsId = isOrder[0].goods_id + ',' + goodsId;
        // allPrise = isOrder[0].allprise + allPrise
        const data = await mysql('nideshop_order').where({
            user_id: openId,
            goods_id: cartId
        }).update({
            allprice: allPrise,
            status: 0
        });
        if (data) {
            ctx.body = {
                data: true
            }
        } else {
            ctx.body = {
                data: false
            }
        }
    } else {
        const data = await mysql('nideshop_order').insert({
            user_id: openId,
            goods_id: cartId,
            allprice: allPrise,
            status: 0
        });
        if (data) {
            ctx.body = {
                data: true
            }
        } else {
            ctx.body = {
                data: false
            }
        }
    }


}
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

}
module.exports = {
    submitAction,
    detailAction,
    listAction
}