// pages/index/index.js
import ApiState from '../../api/ApiState'
import SessionApi from '../../api/SessionApi'
import WxApi from '../../api/WxApi'
Page({
  /**
   * 页面的初始数据
   */
  data: {
    appSession: null,
    isLogin: false
  },
  onLoad: function (options) {
    console.log('index:onLoad')
    this.checkSession()
  },

  checkSession: function (params) {

    if (ApiState.isLogin()) {
      this.setData({
        appSession: ApiState.appSession,
        isLogin: true
      })
      WxApi.switchTab({
        url: '../device/device'
      })
      return
    }

    if (ApiState.requireRegister()) {
      WxApi.redirectTo({
        url: '../register/register'
      })
      return
    }

    this.doLogin()
  },
  doLogin: function () {
    let that = this
    let promise = SessionApi.login({ mode: 'hand' })
    if (!promise) return
    wx.showLoading({
      title: '正在登陆...'
    })
    promise.then(
      (appSession, res) => {
        wx.hideLoading()
        that.checkSession()
      },
      (errMsg, res) => {
        wx.hideLoading()
        console.error('登陆服务器失败:' + errMsg)
        //[100151] 微信OpenId不存在
        if (errMsg.indexOf('[100151]') == 0) that.doLogin()
        //TODO 错误处理
      }
    )
  },

  goWxUser: function () {
    WxApi.redirectTo({
      url: '../wxuser/wxuser'
    })

  },
})
