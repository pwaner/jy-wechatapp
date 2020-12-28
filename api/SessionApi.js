import RestApi from './RestApi'
import WxApi from './WxApi'
import ApiState from './ApiState'
import ApiConfig from './ApiConfig'
function postSession(authData) {
  return new Promise(function (resolve, reject) {
    RestApi.post('/session', { data: authData }).then(
      (res) => {
        RestApi.cookie = res.cookies
        if (res.data && res.data.success) {
          if (res.data.rows == null) {
            resolve(null)
            return
          }
          let appSession = res.data.rows[0]
          ApiState.appSession = appSession
          resolve(appSession)
        } else reject(res.data.message, res)
      },
      (res) => {
        reject(res.errMsg)
      }
    )
  })
}
function loginByCode() {
  return new Promise((resolve, reject) => {
    WxApi.login().then(
      (res) => {
        ApiState.wxLogin = res
        let authData = {
          type: 'TSN001',
          data: {
            method: 'auth_wechatMa',
            wxData: {
              appId: ApiConfig.appId,
              code: ApiState.wxCode
            }
          }
        }
        postSession(authData).then(
          (appSession, res) => {
            resolve(appSession, res)
          },
          (errMsg, res) => {
            reject(errMsg, res)
          }
        )
      },
      (res) => {
        reject(res.errMsg, res)
      }
    )
  })
}
class SessionApi {
  //mode ： 'auto' 不弹出获取账号询问框，  mode: 'hand'  弹出
  static login({ mode = 'auto', authData = null, wxUser = null } = {}) {
    //设置了登录数据直接登录
    if (authData) return postSession(authData)
    //获取到微信用户信息直接登录
    if (wxUser) {
      ApiState.wxUser = wxUser
      authData = {
        type: 'TSN001',
        data: {
          method: 'auth_wechatMa',
          wxData: Object.assign(
            {
              appId: ApiConfig.appId
            },
            wxUser
          )
        }
      }
      return postSession(authData)
    }
    //如果当前状态为登记
    if (ApiState.requireRegister()) {
      WxApi.redirectTo({
        url: '../register/register'
      })
      return null
    }
    let wxCode = ApiState.wxCode
    //如果没有通过wx.login获取过code
    if (!wxCode) return loginByCode()
    wxUser = ApiState.wxUser
    //如果还没有获取微信的用户信息
    //必须先通过wxuser获取微信用户信息
    if (!wxUser) {
      if (mode != 'auto') {
        WxApi.showModal({
          title: '提示',
          content: '需要你的微信账号与我方账号进行绑定，请允许获取微信账号信息，登录后可获取授权的门禁列表，进行开门操作。',
          //   confirmText: '确定'
        }).then((res) => {
          if (res.confirm) {
            WxApi.redirectTo({
              url: '../wxuser/wxuser'
            })
          }
        }, (res) => {
          if (res.confirm) {
            return null

          }
        })
      } else {
        WxApi.redirectTo({
          url: '../wxuser/wxuser'
        })
      }
    }
    return null
  }
  static sendSms(mobile) {
    let authData = {
      type: 'TU001',
      data: {
        mobile: mobile,
        task: 'TSN003'
      }
    }
    return postSession(authData)
  }
}
export default SessionApi
