import ApiState from '../../api/ApiState'
import SessionApi from '../../api/SessionApi'
import ApiConfig from '../../api/ApiConfig'
import Bt1Api from '../../api/Bt1Api'
import WxApi from '../../api/WxApi'
var app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    appSession: null,
    isLogin: false,
    version: null,
    userInfo: false
  },
  onLoad: function (options) {
    this.setData({
      version: ApiConfig.version,
      userInfo: app.globalData.userInfo
    })
    console.log(this.data.userInfo);
    this.checkSession()
  },
  checkSession: function (params) {
    if (ApiState.isLogin()) {
      this.setData({
        appSession: ApiState.appSession,
        isLogin: true
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
    let promise = SessionApi.login()
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

  setBell: async function (e) {
    WxApi.navigateTo({
      url: '../setBell/setBell'
    })
  },
  gateway: async function (e) {
    WxApi.navigateTo({
      url: '../gateway/gateway'
    })
  }
})
