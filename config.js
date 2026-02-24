// API工厂SDK配置文件
// 文档地址: https://www.yuque.com/apifm/nu0f75/cdqz1n
const config = {
  subDomain: '164',
  merchantId: 164,
  sysconfigkeys: 'mallName,kf_tel',
  h5MapSimulator: true, // H5模式下，模拟定位（经纬度为0)，如果你已在项目设置中填写地图key，这里要改为false
  h5Domain: 'https://mealcard.apifm.cn',
  wxh5autologin: false, // 微信内浏览器打开是否启用微信自动登录
}

export default config