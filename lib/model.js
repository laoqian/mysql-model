
var EventEmitter = require("events").EventEmitter;
var debug = require('debug')('model:model');
var validate_rule = require('./validate-rule');

function Model(pool){
  EventEmitter.call(this);

  if(!pool){
    var error  = new Error('mysql pool handle is none');
    throw error;
  }

  this.pool = pool;

  this.rules = {};
  this.data  = {};
  this.valid_data  = {};
  this.sqlObj = {};

  for(var key in validate_rule){
    validate_rule[key] = validate_rule[key].bind(this);
  }

  this.ruleCall = validate_rule;
  this.serialEvents= [];
  this.busy = false; //模型忙标志
}


Model.prototype = Object.create(EventEmitter.prototype);

Model.prototype.addSerialEvent = function(type,cb){
  var len = this.serialEvents.length;
  var serial = {},event = {};


  serial.data = this.data;
  serial.valid_data = this.valid_data;
  serial.sqlObj = this.sqlObj;

  this.clearOldProps();

  event.serial = serial;
  event.type = type;
  event.cb = cb;

  this.serialEvents[len] = event;

  if(this.serialEvents.length == 1 && this.busy == false){
    this.busy = true;
    this.serialEventRun(this.serialEvents[0]);
  }
};

Model.prototype.getNextSerialEvent = function(){
  this.serialEvents = this.serialEvents.slice(1,this.serialEvents.length);
  return this.serialEvents[0];
};


Model.prototype.serialEventRun = function(serialEvent){

  switch(serialEvent.type) {
    case 'create':
     return this.__create(serialEvent);
    case    'add':
      return this.__add(serialEvent);
    case 'update':
      return this.__update(serialEvent);
    case 'select':
      return this.__select(serialEvent);
    default :
      throw  new Error(`serial event error :${serialEvent.event}`);
  }
}


Model.prototype.serialcallback = function(serialEvent,result){
  if(typeof serialEvent.cb === 'function')
    serialEvent.cb(result);
  else
    debug(result.info);

  var nextEvent = this.getNextSerialEvent();
  if(typeof nextEvent == 'object'){
    return this.serialEventRun(nextEvent);
  }

  this.busy = false;
}

Model.prototype.dataVarifyAll =async function(event){
  var data = event.serial.data

  for(var key in data)
  {
    var rules = this.rules[key]
    for(var i in rules){
      var rule_name = rules[i][0]

      var req ={}

      req.key = key
      req.value = data[key]
      req.rule = rules[i]

      var varify = new Promise((resolve,reject)=>{
        req.resolve = resolve
        req.reject = reject

        var rule_api = this.ruleCall[rule_name]
        rule_api(req)
      })

      try{
        await varify
        event.serial.valid_data[key] = req.value
      }
      catch(req){
         return ({status:false,info:`数据库表:${this.table}键:${req.key}-值:${req.value} 规则:${req.rule[0]}校验失败`})
      }
    }
  }
  return ({status:true,info:'校验成功',data:event.serial.valid_data})
}

Model.prototype.validation = function(event){
  return new Promise((resolve,reject)=>{
    this.error = undefined;

    var ret = dataRequireCheck(event.serial.data,this.rules);
    if(ret != true){
      return reject(ret);
    }

    this.dataVarifyAll(event).then(result=>{
      if(result.status==true){
        resolve(result)
      }else{
        reject(result)
      }
    })
  });
};

Model.prototype.create = function(post,cb){
  this.data = post_parse(post);
  if(!this.data){
    return cb({status:false,info:'解析post参数失败'});
  }

  this.addSerialEvent('create',cb);
};

Model.prototype.__create = function(event){

    this.validation(event).then((event,result)=>{
      this.serialcallback(event, {status:true,data:event.serial.valid_data});
    }).catch(err=>this.serialcallback(event,err));

};

Model.prototype.add = function(data,cb){
  if(typeof data === 'object'){
    this.data = data;
  }

  if(typeof data === 'function'){
    return this.addSerialEvent('add',data);
  }

  this.addSerialEvent('add',cb);
}


Model.prototype.__add =function(event){
  debug(event);
  this.validation(event)
    .then((result)=>{
    if (isObjEmpty(event.serial.valid_data)) {
      return this.serialcallback({status:true,info:'没有可用的数据'});
    }

    var sql =createMysqlInsertString(this.table,event.serial.valid_data);
    this.query(sql, (err, rows, field)=>{
      if(err){
        return this.serialcallback(event,{status:false, info:'插入失败',sqlinfo:{err,rows,field}});
      }
      this.serialcallback(event,{status:true,info:'插入成功', sqlinfo:{err,rows,field}});
    });
  })
    .catch(err=>{
      this.serialcallback(event,err)});
}


Model.prototype.update = function(data,cb){

  if(typeof data === 'object'){
    this.data = data;
  }

  if(typeof data === 'function'){
    return this.addSerialEvent('update',data);
  }

  this.addSerialEvent('update',cb);
}


Model.prototype.__update  = function(event){
    if (isObjEmpty(event.serial.data)) {
      return this.serialcallback(event,{status:true,info:'没有可用的数据'});
    }
    var sql =createMysqlUpdateString(this.table,event.serial.data,event.serial.sqlObj.where)

    this.query(sql, (err, rows, field)=>{

      if(err){
        return this.serialcallback(event,{status:false, info:'更新失败',sqlinfo:{err,rows,field}});
      }
      this.serialcallback(event,{status:true,info:'更新成功', sqlinfo:{err,rows,field}});

    });
};


Model.prototype.where = function(str){
  this.sqlObj.where = str;
  return this;
};
Model.prototype.page = function(str){
  this.sqlObj.page = str;
  return this;
}
Model.prototype.order = function(str){
  this.sqlObj.order = str;
  return this;
}
Model.prototype.limit = function(str){
  this.sqlObj.limit = str;
  return this;
}


Model.prototype.select = function(col,cb){
  if(typeof col ==-'string'){
    this.sqlObj.select = col;
  }else{
    this.sqlObj.select = '*';
  }

  if(typeof col=== 'function'){
    return this.addSerialEvent('select',col);
  }

  this.addSerialEvent('select',cb);
}

Model.prototype.__select = function(event){
  var sql = createMysqlSelectString(this.table,event.serial.sqlObj);

  this.query(sql, (err, rows, field)=>{

    if(err){
      return this.serialcallback(event,{status:false, info:'查询失败',err});
    }

    this.serialcallback(event,{status:true,info:'查询成功', rows});
  });

}

Model.prototype.query = function(sql,values,cb){
  return this.pool.query(sql,values,cb);
}

Model.prototype.clearOldProps = function(){
  this.data = {};
  this.valid_data = {};
  this.sqlObj ={};
}
///////////////////////////mysql pool 序列化操作////////////////////////

exports = module.exports = Model;


function createMysqlSelectString(table,sqlObj){
  var sql ='';

  sql = `select ${sqlObj.select} from ${table}`;
  if(typeof sqlObj.where ==='string'){
    sql += ` where ${where}`;
  }

  if(typeof sqlObj.order ==='string'){
    sql+=` order by ${sqlObj.order}`;
  }

  if(typeof  sqlObj.page ==='string'){
    var arg = sqlObj.page.split(',');
    var page = (parseInt(arg[0])-1)*parseInt(arg[1]);
    var per_page_num = arg[1];

    sql+=` limit ${page},${per_page_num}`;
  }else if(typeof sqlObj.limit ==='number' ||typeof sqlObj.limit ==='string'){
    sql+=` limit  ${sqlObj.limit}`;
  }



  debug(sql);
  return sql;
}



function createMysqlUpdateString(table,data,where){
  var sql ='';
  for(var key in data){
    sql+=`${key}='${data[key]}',`;
  }

  sql = sql.substr(0,sql.length-1);

  sql = `update ${table} set ${sql}`;
  if(where){
    sql +=` where ${where}`;
  }

  debug(sql);

  return sql;
}


function createMysqlInsertString(table,data){
  var names ='',values='';
  for(var key in data){
    names+=`${key},`;
    values+=`'${data[key]}',`;
  }

  //去掉最后的逗号
  names = names.substr(0,names.length-1);
  values = values.substr(0,values.length-1);

  var query = `insert into ${table}(${names}) values(${values})`;
  debug(query);
  return query;
}



function dataRequireCheck(data,rules){
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


function isObjEmpty(obj){
  for(var key in obj){
    return false;
  }
  return true;
}


function rules_format(rules){
  var new_rules ={}, form= [];
  for(var key in rules ){

    if(!Array.isArray(rules[key][0])){
      new_rules[key] = [];
      new_rules[key][0] = rules[key];
    }else{
      new_rules[key] = rules[key];
    }
  }

  return  new_rules;
}
