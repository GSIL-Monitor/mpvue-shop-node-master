const {
  mysql
} = require('../../mysql');
async function addCart(ctx) {
  const {
    number,
    goodsId,
    openId,
    skuId,
    showPrice,
    productMsg
  } = ctx.request.body


  //判断购物车是否包含此数据
  const haveGoods = await mysql("nideshop_cart").where({
    "user_id": openId,
    "goods_id": goodsId,
    "goods_name": productMsg,
    "status": 0

  }).select();


  if (haveGoods.length == 0) {
    // const {
    //   retail_price,
    //   name,
    //   list_pic_url
    // } = await mysql("nideshop_goods").where({
    //   "id": goodsId
    // }).select()[0];
    const goods = await mysql("nideshop_goods").where({
      "id": goodsId
    }).select();
    const {
      // retail_price,
      // name,
      list_pic_url
    } = goods[0];
    //如果不存在
    await mysql('nideshop_cart').insert({
      "user_id": openId,
      "goods_id": goodsId,
      number,
      "goods_name": productMsg,
      list_pic_url,
      "retail_price":showPrice,
      "sku_id":skuId,
      "status": 0
    })
  } else {
    //如果存在
    const oldNumber = await mysql("nideshop_cart").where({
      "user_id": openId,
      "goods_id": goodsId,
      "goods_name":productMsg,
      "status": 0
    }).column('number').select();
    // console.log(oldNumber)
    //跟新数据
    await mysql("nideshop_cart").where({
      "user_id": openId,
      "goods_id": goodsId,
      "goods_name":productMsg,
      "status": 0
    }).update({
      "number": oldNumber[0].number + number
    });
  }
  ctx.body = {
    data: "success"
  }
}
async function cartList(ctx) {

  const {
    openId
  } = ctx.query;

  const cartList = await mysql("nideshop_cart").where({
    "user_id": openId,
    "status": 0
  }).select();

  ctx.body = {
    data: cartList
  }

}


async function deleteAction(ctx) {

  const id = ctx.query.id;

  const data = await mysql("nideshop_cart").where({
    "id": id,
  }).update({
    "status": 9
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

module.exports = {
  addCart,
  cartList,
  deleteAction
}