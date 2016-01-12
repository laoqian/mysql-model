
var EventEmitter = require("events").EventEmitter;
var debug = require('debug')('model');
var __mysql = require('mysql');
var options = require('./../config');
var validate_rule = require('./validate_rule');


function model(){
  EventEmitter.call(this);

  this.mysql  = __mysql.createConnection(options);

  this.mysql.connect(err=>{
    if(err){
      console.error('error connecting: ' + err.stack);
      return;
    }
  });

  this.rules = {};
  this.data  = {};
  this.valid_data  = {};

  for(var key in validate_rule){
    validate_rule[key] = validate_rule[key].bind(this);
  }

  this.ruleCall = validate_rule;
}

model.prototype = Object.create(EventEmitter.prototype);

//获取校验信息
model.prototype.get_validate_info = function(req){
  return this.rules[req.key][req.pos][1];
}

model.prototype.validation_middleware = function(req,next){
  if(req.error||!this.rules[req.key] || req.pos >= this.rules[req.key].length){
    return req.callback(req.error,req);
  }

  var call_api = this.ruleCall[this.rules[req.key][req.pos][0]];

  debug(`${req.key}-->${req.value} validation---> ${this.rules[req.key][req.pos][0]}`);

  if(typeof call_api === 'function'){
    return call_api(req,next);
  }

  req.callback(req.error,req);
};


model.prototype.validation_by_key = function(key,value,callback){

  callback = callback.bind(this);

  var req = {key, value, callback, pos:0,error:0};

  function next(){
    debug(req);
    req.pos++;
    this.validation_middleware(req,next.bind(this));
  }

  this.validation_middleware(req,next.bind(this));
};

model.prototype.data_require = function(){
  for(var key in this.rules){
    var item = this.rules[key];
    for(var i=0;i<item.length;i++){
        var jkey = item[i][0];
        if(jkey ==='require' && this.data[key]==undefined){
          this.error = item[i][1];
          return false;
        }
    }
  }

  return true;
};

model.prototype.data_varify_one_by_one = function(callback){
  var varify = [];
  var i = 0;

  for(var key in this.data){
    varify[i] = {};
    varify[i].key = key;
    varify[i++].value = this.data[key];
  }

  i=0;

  function call_api (err,req){
    if(!err){
      this.valid_data[req.key] = req.value;
      this.error = err;
    }else{
      callback(err);
      return;
    }

    debug(this.valid_data);
    if(++i<varify.length){
      this.validation_by_key(varify[i].key,varify[i].value,call_api.bind(this));
    } else{
      callback();
    }
  }

  this.validation_by_key(varify[0].key,varify[0].value,call_api.bind(this));
};

model.prototype.add = function(){
  return new Promise((resolve,reject)=>{
    this.error = undefined;
    if(!this.data_require()){
      reject(this.error);
      return;
    }

    this.data_varify_one_by_one(err=>{
      if(!err){
        resolve();
      }else{
        reject(err);
      }
    });
  });
};



exports = module.exports = model;













