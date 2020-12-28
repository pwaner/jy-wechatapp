const _config = {
  //appId: 'wx5d35d0d46340736f', //生产服务
  //appId: 'wxa79452e42f4d749a', //测试服务
  //mainUrlDev: 'http://localhost:9290', //本地开发 不能真机调试
  mainUrlDev: 'http://dev.nkdr-cssp.com', //本地开发
  mainUrlTest: 'https://test.zayutech.com', //测试服务器
  mainUrlPro: 'https://cloud.zayutech.com', //生产服务器
  appId: '',
  version: '1.0.7' //！！！！！发布记得修改版本号！！！！！
}
class ApiConfig {
  static get appId() {
    _config.appId = wx.getAccountInfoSync().miniProgram.appId
    console.log('appId:' + _config.appId)
    return _config.appId;
    // console.log('appId:' + wx.getAccountInfoSync().miniProgram.appId)
    // return wx.getAccountInfoSync().miniProgram.appId
  }
  static get mainUrl() {
    if (_config.appId == 'wx5d35d0d46340736f')
      return _config.mainUrlPro //生产服务器
    if (_config.appId == 'wxa79452e42f4d749a')
      return _config.mainUrlTest //测试服务器
    return _config.mainUrlDev //本地开发
    // return _config.mainUrlTest  //测试服务器
  }
  static get apiUrl() {
    return ApiConfig.mainUrl + '/api/wechat/ma'
  }

  static get version() {
    return _config.version
  }
}
export default ApiConfig