# mysql-model
在mysql的基础上增加创建模型以及验证，仅此而已



#validate_rule 添加方法


在 validate_rule.js 中按照如下方式

exports['rule_name'] = function (req,next){
    //验证代码

    next(); //此处注意，要在函数的出口显示的调用next，如果有多个出口所有出口都要调用，不然会验证出错。
}


