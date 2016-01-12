# mysql-model
在mysql的基础上增加创建模型以及验证，仅此而已


###如何创建model

```js
var model = require('model');

function  new_model (pool){
    var my_model = new model(pool);

    my_model.table = 'eb_vip';
    my_model.data['id'] = 1;
    ....
}
exports = module.exports = new_model;
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


