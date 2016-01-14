/**
 * Created by gg on 2016/1/10.
 */

var createMysqlPool = require('./../addons/mysql_pool');
var model = require('./vip-model');
var debug = require('debug')('test');

var pool = createMysqlPool();

var vip  =new model(pool);


vip.data['name'] ='我的栏目';
vip.data['comm'] = '这是一个栏目的测试，谢谢使用';



vip.add();


vip.data['name'] = '我只是修改';
vip.where('id=21').update();

vip.data['name'] = '我只是修改';

vip.update();



