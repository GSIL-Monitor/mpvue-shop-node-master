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
        // const data = await mysql('nideshop_order').where({
        //     user_id: openId,
        //     goods_id: cartId,
        //     status: 0
        // }).update({
        //     allprice: allPrise
        // });
       
        ctx.body = {
            flag: true,
            data: isOrder[0].id
        }

    } else {
        const orderId = await mysql('nideshop_order').insert({
            user_id: openId,
            goods_id: cartId,
            allprice: allPrise,
            status: 0,
            order_time: new Date().getTime()
        });
         
        let cartArr = cartId.split(",");
        const goodslist = await mysql('nideshop_cart').whereIn('id', cartArr).select();

        for (let item of goodslist) {
            await mysql('nideshop_order_goods').insert({
                order_id: orderId,
                goods_id: item.goods_id,
                goods_name: item.goods_name,
                number: item.number,
                retail_price: item.retail_price,
                list_pic_url: item.list_pic_url
            });
        }


        await mysql('nideshop_cart').andWhere({
            user_id: openId
        }).whereIn('id', cartArr).update({
            status: 1
        });


        if (orderId) {
            ctx.body = {
                data: orderId,
                flag: true
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
    const orderId = ctx.query.orderId;
    const addressId = ctx.query.addressId || '';

    const orderDetail = await mysql('nideshop_order').where({
        user_id: openId,
        id: orderId
    }).select();

    const list = await mysql('nideshop_order_goods').where({
        order_id: orderId
    }).select();

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
        orderId,
        address,
        payPrice
    } = ctx.request.body;


    //是否存在在订单
    const isOrder = await mysql('nideshop_order').where({
        user_id: openId,
        id: orderId,
        status: 0
    }).select();
    // 存在
    // var nowgoodsid = "";
    if (isOrder.length > 0) {

        const data = await mysql('nideshop_order').where({
            user_id: openId,
            id: orderId
        }).update({
            status: 1,
            allprice: payPrice
        });

        let addressInfo =  address.address + address.address_detail +"  "+ address.name + address.mobile;

        await mysql('nideshop_order_express').insert({
            order_id: orderId,
            is_finish: 1,
            add_time: new Date().getTime(),
            address_id: address.id,
            addressinfo: addressInfo
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
       
            ctx.body = {
                data: false
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
    let goodsInfo = ctx.request.body.goodsInfo;

    let allPrise = Number(showPrice)*Number(number);

    const orderId = await mysql('nideshop_order').insert({
        user_id: openId,
        goods_id: goodsId,
        allprice: allPrise,
        status: 0,
        order_time: new Date().getTime()
    });

    if(goodsInfo){
        await mysql('nideshop_order_goods').insert({
            order_id: orderId,
            goods_id: goodsId,
            goods_name: productMsg,
            number: number,
            retail_price: showPrice,
            list_pic_url: goodsInfo.list_pic_url
        });
    
    }

  
    if (orderId) {
        ctx.body = {
            flag: true,
            data: orderId
        }
    } else {
        ctx.body = {
            flag: false
        }
    }



}


module.exports = {
    submitAction,
    detailAction,
    payAction,
    ordernowAction
}