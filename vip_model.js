/**
 * Created by gg on 2016/1/10.
 */

var model = require('./lib/model');

function vip_model(pool){
  var vip_model = new model(pool);

  vip_model.table = 'eb_vip';
  vip_model.rules['id'] =[['unique','id重复','none']];
  vip_model.rules['name'] =[['unique','用户名重复','none'], ['length' ,'长度不正确！','4,10']];
  vip_model.rules['qq'] =[['require','qq号码是必须的','none'], ['equal','两次不相等','pwd']];

  return vip_model;
}


exports  = module.exports = vip_model;







