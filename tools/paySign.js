'use strict';
const crypto = require('crypto');
function paysignjsapi(params) {
  let param = params;
  var key = '';
  var ret = {};
  // console.log("param.key",param.key);
  if(param.key) {
    key = param.key;
    delete param.key;
    ret = param;
  } else {
    ret = param;
  }
  var str = raw(ret);
  //将参数拼接成字符串
  str = str + '&key='+key;
  var md5Str = crypto.createHash('md5').update(str).digest('hex');
  md5Str = md5Str.toUpperCase();
  return md5Str;
};
//字符排序连接
function raw(args) {
  var keys = Object.keys(args);
  keys = keys.sort();
  var newArgs = {};
  keys.forEach(function(key) {
    newArgs[key] = args[key];
  });
  var str = '';
  for(var k in newArgs) {
    str += '&' + k + '=' + newArgs[k];
  }
  str = str.substr(1);
  return str;
};
module.exports = {
  paysignjsapi
}