import ApiConfig from './ApiConfig'
import WxApi from './WxApi'
class RestApi {
  static get cookie() {
    let cookie = wx.getStorageSync('cookieValue')
    console.log('readCookie:' + cookie)
    return cookie
  }
  static set cookie(value) {
    if (!value) return
    if (value.length == 0) return
    let cookie = value.length ? value[0] : value
    //console.log('writeCookie:' + cookie)
    wx.setStorageSync('cookieValue', cookie)
  }
  static post(path, options) {
    var options = options || {}
    options.url = ApiConfig.apiUrl + path
    options.method = 'POST'
    options.header = {
      'content-type': 'application/json',
      Cookie: RestApi.cookie
    }
    return WxApi.request(options)
  }

  static get(path, options) {
    var options = options || {}
    options.url = ApiConfig.apiUrl + path
    options.method = 'GET'
    options.header = {
      'content-type': 'application/json',
      Cookie: RestApi.cookie
    }
    return WxApi.restRequest(options)
  }
}
export default RestApi