/**
 * Created by gg on 2016/1/10.
 */

var model = require('./../lib/model');

function vip_model(pool){
  model.call(this,pool);

  this.table = 'eb_vip';

  this.rules = { id: ['unique', 'id重复'],
                      sn:['type', 'sn类型不正确', 'int'],
                      name:[['unique', '用户名重复'], ['length', 'name长度不正确！', '4,10']],
                      qq:[['require', 'qq号码是必须的'], ['equal', 'qq和pwd不相等', 'pwd']]
                    };

  this.auto = {
    id:this.new_id
  };

  this.new_id = function(){
    return math.random();
  };

}

vip_model.prototype = Object.create(model.prototype);

exports  = module.exports = vip_model;







