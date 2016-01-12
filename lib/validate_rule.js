/**
 * Created by gg on 2016/1/11.
 */

var debug = require('debug')('rules');


exports['unique'] = function(req,next){

  var str  =`select * from ${this.table} where ${req.key}=${req.value}`;

  debug(str);

  this.mysql.query(str,(err,rows,field)=>{
    if(err){
      this.error = `数据库错误-->${err}`;
    }

    if(rows.length>0){
      req.error = this.get_validate_info(req);
    }

    next();
  });
};

exports['length'] = function(req,next){
  var rule = this.rules[req.key][req.pos];
  var ret = false;
  var str = rule[2].split(',');
  if(str.length == 2){
    debug(`${req.value.length}----${str[1]}---${str[0]}`);
    if(req.value.length<=parseInt(str[1]) && req.value.length>=parseInt(str[0])){
      ret = true;
    }
  }else{
     if(req.value.length ==parseInt(str[0])){
       ret =true;
     }
  }

  if(ret==false){
    req.error = this.get_validate_info(req);
  }

  next();
};

exports['require'] = function(req,next){

  if(this.data[req.key] == undefined){
    req.error = this.get_validate_info(req);
  }

  next();
};


exports['equal'] = function(req,next){
  if(this.data[req.key] != this.data[this.rules[req.key][req.pos][2]]){
    req.error = this.get_validate_info(req);
  }

  next();
};
