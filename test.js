/**
 * Created by gg on 2016/1/10.
 */

var createMysqlPool = require('./lib/mysql_pool');
var model = require('./lib/model');
var debug = require('debug')('test');

var vip_model = new model(createMysqlPool());

vip_model.table = 'eb_vip';

vip_model.rules['id'] =[
  ['unique','id重复','none']
];
vip_model.rules['name'] =[
  ['unique','用户名重复','none'],
  ['length' ,'长度不正确！','4,10']
];
vip_model.rules['qq'] =[
  ['require','qq号码是必须的','none'],
  ['equal','两次不相等','pwd']
];

vip_model.data['id'] = 2;
vip_model.data['name'] ='123456';
vip_model.data['account'] =1;
vip_model.data['pwd'] =2;
vip_model.data['qq'] =1;


vip_model.validation().then(()=>{
  debug(111);
},(err)=>{
  debug(err);
});




