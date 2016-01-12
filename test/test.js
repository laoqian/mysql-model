/**
 * Created by gg on 2016/1/10.
 */

var createMysqlPool = require('./../addons/mysql_pool');
var model = require('./vip-model');
var debug = require('debug')('test');

var pool = createMysqlPool();

var vip  =new model(pool);


vip.data['id'] = 111;
vip.data['qq'] = 111;
vip.data['name'] = '1111111111';
vip.data['pwd'] = 111;
vip.data['sn'] = '222';


vip.validation().then(()=>{
  debug('成功啦。你真厉害')
},(err)=>{
  debug(err);
});








