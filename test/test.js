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
vip.data['name'] = 111;
vip.data['pwd'] = 111;


vip.validation();







