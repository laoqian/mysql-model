/**
 * Created by gg on 2016/1/10.
 */

var model = require('./../lib/model');

function vip_model(pool){
  var vip_model = new model(pool);

  vip_model.table = 'eb_vip';

  vip_model.rules = { id: ['unique', 'id重复'],
                      sn:['type', 'sn类型不正确', 'int'],
                      name:[['unique', '用户名重复'], ['length', 'name长度不正确！', '4,10']],
                      qq:[['require', 'qq号码是必须的'], ['equal', 'qq和pwd不相等', 'pwd']]
                    };

  vip_model.auto = {
    id:new_id
  };


  return vip_model;
}


exports  = module.exports = vip_model;







