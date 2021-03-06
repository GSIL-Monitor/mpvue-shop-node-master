const {
    mysql
} = require('../../mysql');
var rawbody = require('raw-body');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

// 检查订单和入库
async function handlerOrder(result) {
    let returnValue = {};
    returnValue.appid = result.xml.appid[0];
    returnValue.bank_type = result.xml.bank_type[0];
    returnValue.cash_fee = result.xml.cash_fee[0];
    returnValue.fee_type = result.xml.fee_type[0];
    returnValue.is_subscribe = result.xml.is_subscribe[0];
    returnValue.mch_id = result.xml.mch_id[0];
    returnValue.nonce_str = result.xml.nonce_str[0];
    returnValue.openid = result.xml.openid[0];
    returnValue.out_trade_no = result.xml.out_trade_no[0];
    returnValue.result_code = result.xml.result_code[0];
    returnValue.sign = result.xml.sign[0];
    returnValue.time_end = result.xml.time_end[0];
    returnValue.total_fee = result.xml.total_fee[0];
    returnValue.trade_type = result.xml.trade_type[0];
    returnValue.transaction_id = result.xml.transaction_id[0];
    //是否存在在订单
    const isWepay = await mysql('nideshop_wepay').where({
        out_trade_no: returnValue.out_trade_no
    }).select();

    if (isWepay.length < 1) {

        await mysql('nideshop_wepay').insert({
            appid: returnValue.appid,
            bank_type: returnValue.bank_type,
            cash_fee: returnValue.cash_fee,
            fee_type: returnValue.fee_type,
            is_subscribe: returnValue.is_subscribe,
            mch_id: returnValue.mch_id,
            nonce_str: returnValue.nonce_str,
            openid: returnValue.openid,
            out_trade_no: returnValue.out_trade_no,
            result_code: returnValue.result_code,
            sign: returnValue.sign,
            time_end: returnValue.time_end,
            total_fee: returnValue.total_fee,
            trade_type: returnValue.trade_type,
            transaction_id: returnValue.transaction_id
        });
    }

    //是否存在在订单
    const isOrderUpdate = await mysql('nideshop_order').where({
        id: returnValue.out_trade_no
    }).select();
    // 存在
    // var nowgoodsid = "";
    if (isOrderUpdate.length > 0) {
        await mysql('nideshop_order').where({
            id: returnValue.out_trade_no,
        }).update({
            status: 1
        });

    }
}

async function repsAction(ctx) {


    const notify_xml = await rawbody(ctx.req, {
        length: ctx.request.length,
        limit: '1mb',
        encoding: ctx.request.charset || 'utf-8'
    })

    let bodyData = '<xml>';

    parser.parseString(notify_xml, (err, result) => {
        if (err) {
            console.log(err)
        } else {
            if (result.xml.return_code[0] === 'SUCCESS') { 
                bodyData += '<return_code>SUCCESS</return_code>';
                bodyData += '<return_msg>OK</return_msg>';
                bodyData += '</xml>';
                handlerOrder(result)
            } else {
                bodyData += '<return_code>FAIL</return_code>';
                bodyData += '<return_msg>FAIL</return_msg>';
                bodyData += '</xml>';
            }
        }
    })

    ctx.type = 'application/xml';
    ctx.body = bodyData;

}



module.exports = {
    repsAction
}