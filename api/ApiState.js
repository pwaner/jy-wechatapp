/**
 * 当前访问状态
 * unknown 初始化状态
 * login 未登陆状态
 * register 微信未和自然人绑定状态
 * loggedin 已经登陆状态
 */
let _state = 'unknown'
let _data = {
  //wx.login返回res
  wxLogin: null,
  //wx.getUserInfo返回res
  wxUser: null,
  ///sessions返回的rows[0]
  appSession: null,
  bleDevice: null,//设备
}
class ApiState {
  static isLogin() {
    return _state == 'loggedin'
  }
  static requireRegister() {
    return _state == 'register'
  }
  static get appSession() {
    return _data.appSession
  }
  static set appSession(value) {
    _data.appSession = value
    if (value) {
      if (value.action == 'wechatRegister') _state = 'register'
      else if (value.eid) _state = 'loggedin'
    }
  }
  static set wxLogin(value) {
    _data.wxLogin = value
  }
  static set wxUser(value) {
    _data.wxUser = value
  }
  static get wxUser() {
    return _data.wxUser
  }
  static get wxCode() {
    let wxLogin = _data.wxLogin || {}
    return wxLogin.code
  }
  static set bleDevice(value) {
    _data.bleDevice = value
  }
  static get bleDevice() {
    return _data.bleDevice
  }
  static reSet() {
    _state = 'unknown'
    _data = {
      //wx.login返回res
      wxLogin: null,
      //wx.getUserInfo返回res
      wxUser: null,
      ///sessions返回的rows[0]
      appSession: null,
      bleDevice: null,//设备
    }
  }

}
export default ApiState
