
var EventEmitter = require("events").EventEmitter;
var debug = require('debug')('model');
var validate_rule = require('./validate_rule');


function model(pool){
  EventEmitter.call(this);

  if(!pool){
    var error  = new Error('mysql pool handle is none');
    throw error;
  }

  this.pool = pool;

  this.rules = {};
  this.data  = {};
  this.valid_data  = {};

  for(var key in validate_rule){
    validate_rule[key] = validate_rule[key].bind(this);
  }

  this.ruleCall = validate_rule;
}

model.prototype = Object.create(EventEmitter.prototype);


/*
*
*
* 使用异步的方法一个接一个的校验数据的有效性,该验证方法为同步方式，只要有一个数据验证失败，立即报错.
* req.data ：需要校验的数据对象键值对数组,req.data[i].key = 数据库字段 ,req.data[i].value = 字段当前值
* req.rules：当前的所有验证规则
* req.cur_data_pos：当前验证数据在req.data中的数据下标
* req.cur_rule_pos:当前校验的数据的所有规则在req.cur_rule数组中的索引
* req.cur_rule：当前验证数据的所有验证规则,为数据
* req.cur_data：当前验证的数据键值对对象
*
* */

model.prototype.data_varify_one_by_one = function(callback){
  callback = callback.bind(this);
  if(!this.data){
    return callback(`${this.table} 没有数据可以校验`);
  }

  var req = { data:obj_to_arr(this.data),
              rules:this.rules,
              cur_data_pos:0 ,
              cur_rule_pos:-1,
              error:0
            };

  req.throw_error = function(error){
    if(!error)
      req.error = req.cur_rule[req.cur_rule_pos][1];
    else
      req.error = error;
  };

  ((function next (){
    if(req.error){
      return callback(req.error);
    }

    req.cur_data = req.data[req.cur_data_pos];
    req.cur_rule = req.rules[req.cur_data.key];

    if(!req.cur_rule || (req.cur_rule_pos+1)>=req.cur_rule.length){
      this.valid_data[req.cur_data.key] = req.cur_data.value;
      req.cur_data_pos++   ;
      req.cur_rule_pos =  -1;
      return (next.bind(this))();
    }

    if((req.cur_rule_pos+1)<req.cur_rule.length){
      req.cur_rule_pos++ ;
    }

    var call_api = this.ruleCall[req.cur_rule[req.cur_rule_pos][0]];
    if(call_api){
      return call_api(req,next.bind(this));
    }

    callback();
  }).bind(this))()
};

model.prototype.validation = function(){
  return new Promise((resolve,reject)=>{
    this.error = undefined;

    var ret = data_require_check(this.data,this.rules);
    if(ret != true){
      return reject(ret);
    }

    this.data_varify_one_by_one(err=>{
      if(err){
        return reject(err);
      }

      resolve();
    });
  });
};


///////////////////////////mysql pool Promise 操作r////////////////////////


model.prototype.link = function link(){
  return new Promise((resolve,reject)=>{
    this.pool.getConnection((err,cli)=>{
      if(err){
        return reject();
      }
      resolve(cli);
    });
  });
};


exports = module.exports = model;


function data_require_check(data,rules){
  for(var key in rules){
    var item = rules[key];
    for(var i=0;i<item.length;i++){
      var ikey = item[i][0];
      if(ikey ==='require' && data[key] == undefined){
        return item[i][1];
      }
    }
  }

  return true;
}

function obj_to_arr(obj){
  var ret =[],i=0;

  for(var key in obj){
    ret[i] ={};
    ret[i].key = key;
    ret[i++].value = obj[key];
  }
  return ret;
}



