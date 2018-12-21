const {
    mysql
} = require('../../mysql')

const paysign = require('../../tools/paySign') 

const CONF = require('../../config')

const request = require('request');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

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

async function getPrepayId(ctx) {
    const {
        openId,
        payPrice,
        orderId
    } = ctx.request.body;
    const spbill_create_ip = '192.168.1.1';//ctx.header.host.replace(/::ffff:/, ''); //ctx.header.host.replace(/::ffff:/, ''); // 获取客户端ip
    const body = '测试支付'; // 商品描述
    const notify_url = CONF.notify_url+'/wepaynotify/repsAction' // 支付成功的回调地址  可访问 不带参数
    const nonce_str = new Date().getTime() + ''; // 随机字符串
    const out_trade_no = orderId + ''; // 商户订单号
    const total_fee = '1';     //payPrice + ''; // 订单价格 单位是 分
    const timestamp = Math.round(new Date().getTime() / 1000); // 当前时间
    const ret = {
        appid: CONF.appId,
        mch_id: CONF.mchId,
        nonce_str: nonce_str,
        body: body,
        out_trade_no: out_trade_no,
        total_fee: total_fee,
        spbill_create_ip: spbill_create_ip,
        notify_url: notify_url,
        openid: openId,
        trade_type: 'JSAPI',
        key: CONF.mchKey
    }

    // 签名
    const sign = paysign.paysignjsapi(ret);
    let bodyData = '<xml>';
    bodyData += '<appid>' + CONF.appId + '</appid>'; // 小程序ID
    bodyData += '<body>' + body + '</body>'; // 商品描述
    bodyData += '<mch_id>' + CONF.mchId + '</mch_id>'; // 商户号
    bodyData += '<nonce_str>' + nonce_str + '</nonce_str>'; // 随机字符串
    bodyData += '<notify_url>' + notify_url + '</notify_url>'; // 支付成功的回调地址
    bodyData += '<openid>' + openId + '</openid>'; // 用户标识
    bodyData += '<out_trade_no>' + out_trade_no + '</out_trade_no>'; // 商户订单号
    bodyData += '<spbill_create_ip>' + spbill_create_ip + '</spbill_create_ip>'; // 终端IP
    bodyData += '<total_fee>' + total_fee + '</total_fee>'; // 总金额 单位为分
    bodyData += '<trade_type>JSAPI</trade_type>'; // 交易类型 小程序取值如下：JSAPI
    bodyData += '<sign>' + sign + '</sign>';
    bodyData += '</xml>';
    // 微信小程序统一下单接口
    const returnValue = {};
    const urlStr = 'https://api.mch.weixin.qq.com/pay/unifiedorder';
    const payResult = () => new Promise((resolve, reject) => request({
            url: urlStr, 
            method: 'POST',
            body: bodyData
        }, (err, response, body) => {
            if (err) {
                reject(err);
            } else {
                resolve(body);
            }
        })
    )
    await payResult().then((body) => {
        parser.parseString(body, (err, result) => {
            if(err) {
                console.log(err)
            } else {
                if (result.xml.return_code[0] === 'SUCCESS') {
                    returnValue.msg = '操作成功';
                    returnValue.status = '100';
                    returnValue.out_trade_no = out_trade_no; // 商户订单号
                    // 小程序 客户端支付需要 nonceStr,timestamp,package,paySign  这四个参数
                    returnValue.nonceStr = result.xml.nonce_str[0]; // 随机字符串
                    returnValue.timestamp = timestamp.toString(); // 时间戳
                    returnValue.package = 'prepay_id=' + result.xml.prepay_id[0]; // 统一下单接口返回的 prepay_id 参数值
                    const wxSign = {
                        appId: CONF.appId, //小程序ID
                        nonceStr: returnValue.nonceStr, //随机串
                        package: returnValue.package, //数据包
                        signType: 'MD5', //签名方式
                        timeStamp: returnValue.timestamp, //时间戳
                        key: CONF.mchKey
                    }
                    returnValue.paySign = paysign.paysignjsapi(wxSign); // 签名
                } else {
                    returnValue.msg = result.xml.return_msg[0];
                    returnValue.status = '102';
                }
            }
        })
    }).catch(err => {
        console.log(err)
    })
    ctx.body = returnValue
}


module.exports = {
    submitAction,
    detailAction,
    payAction,
    ordernowAction,
    getPrepayId
}