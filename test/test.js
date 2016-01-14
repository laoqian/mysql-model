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



//vip.add();
//var i = 0
//setInterval(()=>{
//  vip.data['name'] ='我的栏目';
//  vip.data['comm'] = '这是一个栏目的测试，谢谢使用';
//  vip.add();
//},100);



vip.where('id=100').delete();