const {
    mysql
} = require('../../mysql');

async function submitAction(ctx) {
    const {
        openId,
    } = ctx.request.body;
    let cartId = ctx.request.body.cartId;
    let allPrise = ctx.request.body.allPrise
    //是否存在未支付的订单
    const isOrder = await mysql('nideshop_order').where({
        user_id: openId,
        goods_id: cartId,
        status: 0
    }).select();
    // 存在
    // var nowgoodsid = "";
    if (isOrder.length > 0) {
        //现在的goodsId加上以前的
        // goodsId = isOrder[0].goods_id + ',' + goodsId;
        // allPrise = isOrder[0].allprise + allPrise
        const data = await mysql('nideshop_order').where({
            user_id: openId,
            goods_id: cartId,
            status: 0
        }).update({
            allprice: allPrise
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


async function payAction(ctx) {
    const {
        openId,
    } = ctx.request.body;
    let cartId = ctx.request.body.cartId;
    let allPrise = ctx.request.body.allPrise
    //是否存在在订单
    const isOrder = await mysql('nideshop_order').where({
        user_id: openId,
        goods_id: cartId,
        status: 0
    }).select();
    // 存在
    // var nowgoodsid = "";
    if (isOrder.length > 0) {
        //现在的goodsId加上以前的
        // goodsId = isOrder[0].goods_id + ',' + goodsId;
        // allPrise = isOrder[0].allprise + allPrise
        const data = await mysql('nideshop_order').where({
            user_id: openId,
            goods_id: cartId,
            status: 0
        }).update({
            allprice: allPrise
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



async function ordernowAction(ctx) {
    const {
        openId,
    } = ctx.request.body;
    let goodsId = ctx.request.body.goodsId;
    let number = ctx.request.body.number;
    let skuId = ctx.request.body.skuId;
    let showPrice = ctx.request.body.showPrice;
    let productMsg = ctx.request.body.productMsg;

    //购物车逻辑开始
    //判断购物车是否包含此数据
    const haveGoods = await mysql("nideshop_cart").where({
        "user_id": openId,
        "goods_id": goodsId,
        "goods_name": productMsg,
        "status": 8
    }).select();

    if (haveGoods.length == 0) {
        const goods = await mysql("nideshop_goods").where({
            "id": goodsId
        }).select();
        const {
            // retail_price,
            // name,
            list_pic_url
        } = goods[0];
        //插入购物车
        await mysql('nideshop_cart').insert({
            "user_id": openId,
            "goods_id": goodsId,
            number,
            "goods_name": productMsg,
            list_pic_url,
            "retail_price": showPrice,
            "sku_id": skuId,
            "status": 8
        });

    } else {
        //如果存在更改数量为最新下单数量
        await mysql("nideshop_cart").where({
            "user_id": openId,
            "goods_id": goodsId,
            "goods_name": productMsg,
            "status": 8
        }).update({
            "number": number
        });
    }
    //购物车逻辑结束

    const newCart = await mysql("nideshop_cart").column('id').where({
        user_id: openId,
        goods_id: goodsId,
        goods_name: productMsg,
        status: 8
    }).select();

    let newCartId = 0;
    if (newCart.length > 0) {
        newCartId = newCart[0].id;
    }

    let allPrise = Number(number) * Number(showPrice);


    //是否存在在订单
    const isOrder = await mysql('nideshop_order').where({
        user_id: openId,
        goods_id: newCartId,
        status: 0
    }).select();
    // 存在
    // var nowgoodsid = "";
    if (isOrder.length > 0) {

        const data = await mysql('nideshop_order').where({
            user_id: openId,
            goods_id: newCartId,
            status: 0
        }).update({
            allprice: allPrise
        });
        if (data) {
            ctx.body = {
                flag: true,
                data: newCartId
            }
        } else {
            ctx.body = {
                flag: false
            }
        }

    } else {
        const data = await mysql('nideshop_order').insert({
            user_id: openId,
            goods_id: newCartId,
            allprice: allPrise,
            status: 0
        });
        if (data) {
            ctx.body = {
                flag: true,
                data: newCartId
            }
        } else {
            ctx.body = {
                flag: false
            }
        }

    }

}


module.exports = {
    submitAction,
    detailAction,
    payAction,
    ordernowAction
}