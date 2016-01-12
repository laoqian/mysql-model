# mysql-model
在mysql的基础上增加创建模型以及验证，仅此而已


###如何创建model

```js
//vip_model.js
var model = require('model');

function  new_model (pool){
    var my_model = new model(pool);

    my_model.table = 'eb_vip';
    vip_model.rules['id'] =[['unique','id重复','none']];
    ....
}
exports = module.exports = new_model;
```
###新建模型验证
```js
    var model= require('./vip_model');
    var mysql = require('mysql');

    var pool = mysql.createMysqlPool(options);

    var vip = new model(pool);

   //add data
    vip.data['id']  = 1;
   // validation
    vip.validation().then(()=>{
        //验证成功
        ...
    },(err)=>{
        //验证失败
        ...
    });
    //保存数据库，会自动验证
    vip.add().then(()=>{
         //添加成功
         ...
     },(err)=>{
         //添加失败
         ...
     });

   //根据post参数创建数据会自动验证
    vip.create(post).then(()=>{
         //添加成功
         ...
     },(err)=>{
         //添加失败
         ...
     });

```

###validate_rule 添加新的规则

在 validate_rule.js 中按照如下方式

```js
exports['rule_name'] = function (req,next){
    //验证代码
    ...
    next(); //此处注意，要在函数的出口显示的调用next，如果有多个出口所有出口都要调用，不然会验证出错。
}

```


