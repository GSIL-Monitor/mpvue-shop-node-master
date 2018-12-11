'use strict'
const crypto = require('crypto')
const request = require('axios')
const xml2js = require('xml2js')
const parser = new xml2js.Parser()
const builder = new xml2js.Builder()
const qs = require('querystring')

//生成签名
function getSign(data, apiKey) {
  const tmpObj = Object.create(null)
  for (const k of Object.keys(data).sort()) tmpObj[k] = data[k]
  const key = decodeURIComponent(qs.stringify(tmpObj) + '&key=' + apiKey)
  return crypto.createHash('md5').update(key).digest('hex').toUpperCase()
}

class WXPay {
  constructor(options, apikey) {
    this.options = options
    this.apiKey = apikey
    this.unifyOrderUrl = 'https://api.mch.weixin.qq.com/pay/unifiedorder'
    this.queryOrderUrl = 'https://api.mch.weixin.qq.com/pay/orderquery'
    this.sign = ''
  }
  //请求统一下单
  unifyOrder (obj) {
    this.sign = getSign(Object.assign(obj, this.options), this.apiKey)
    const _wxData = builder.buildObject(Object.assign(obj, { sign: this.sign }))
    return request.post(this.unifyOrderUrl, _wxData, {headers: { 'content-type': 'text/xml' }})
      .then(result => result.data)
      .then(function (result) {
        if (!result) return Promise.reject(new Error('数据不存在'))
        return new Promise(function(resolve, reject) {
          parser.parseString(result, (err, _data) => err ? reject(err) : resolve(_data.xml))})
      })
      .catch(err => Promise.reject(err))
  }
  //获取微信支付配置
  WXPayConfig (data) {
    return this.unifyOrder(data).then(result => {
      if (!result) return Promise.reject(new Error('something go wrong'))
      for (let key in result) result[key] = result[key][0]
      const _tmpData = {
        appId: result.appid,
        timeStamp: (Date.now()/1000).toString(),
        nonceStr: result.nonce_str,
        package: 'prepay_id=' + result.prepay_id,
        signType: 'MD5'
      }
      _tmpData.paySign = getSign(_tmpData, this.apiKey)
      return _tmpData
    }).catch(err => Promise.reject(err))
  }
  //查询订单状态
  queryWXOrders (obj) {
    this.sign = getSign(Object.assign(obj, this.options), this.apiKey)
    const _WXData = builder.buildObject(Object.assign(obj, { sign: this.sign }))
    return request.post(this.queryOrderUrl, _WXData, {headers: { 'content-type': 'text/xml' }})
      .then(result => result.data)
      .then(function (result) {
        if (!result) return Promise.reject(new Error('数据不存在'))
        return new Promise(function(resolve, reject) {
          parser.parseString(result, (err, _data) => err ? reject(err) : resolve(_data.xml))})
      })
      .catch(err => Promise.reject(err))
  }
}
module.exports = WXPay