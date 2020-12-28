import WxApi from '../../api/WxApi'
import SessionApi from '../../api/SessionApi'
import ApiState from '../../api/ApiState'
import ApiConfig from '../../api/ApiConfig'
var app = getApp();

Page({
  data: {
    buttonType: 'default',
    userInfo: null,
    hasUserInfo: false,
    version: null
  },
  onLoad: function (options) {
    this.setData({
      version: ApiConfig.version
    })
  },
  onGotUserInfo: function (e) {
    let wxUser = e.detail
    this.setData({
      userInfo: wxUser.userInfo,
      hasUserInfo: true
    })
    wx.showLoading({
      title: '正在登陆...'
    })
    app.globalData.userInfo = true;  //修改全局中的登陆状态
    SessionApi.login({ wxUser: wxUser }).then(
      (appSession, res) => {
        wx.hideLoading()
        console.log('登陆服务器成功:' + appSession.action)
        if (ApiState.requireRegister())
          WxApi.redirectTo({
            url: '../register/register'
          })
        else
          WxApi.redirectTo({
            url: '../index/index'
          })
      },
      (errMsg, res) => {
        wx.hideLoading()
        console.error('登陆服务器失败:' + errMsg)
      }
    )
  },
  getUserInfo: function () {
    wx.showLoading({
      title: '正在读取...'
    })
    WxApi.getUserInfo()
      .then((res) => {
        wx.hideLoading()
      })
      .catch((res) => {
        wx.hideLoading()
        console.error('读取微信用户信息失败:' + res.errMsg)
      })
  }
})
