const util = require('../../utils/util.js')
import SessionApi from '../../api/SessionApi'
import WxApi from '../../api/WxApi'
import ApiConfig from '../../api/ApiConfig'

var app = getApp()
Page({
  data: {
    buttonType: 'default',
    mobile: '',
    smsCode: '',
    send: true,
    alreadySend: false,
    second: 60,
    disabled: true,
    version: null
  },
  onLoad: function (options) {
    this.setData({
      version: ApiConfig.version
    })
  },
  doRegister: function () {
    var authData = {
      type: 'TSN001',
      data: {
        method: 'auth_mobile',
        mobile: this.data.mobile,
        smsCode: this.data.smsCode
      }
    }
    wx.showLoading({
      title: '正在登陆...'
    })
    SessionApi.login({ authData: authData }).then(
      (appSession, res) => {
        wx.hideLoading()
        console.log('登陆服务器成功:' + appSession.name)
        WxApi.redirectTo({
          url: '../index/index'
        })
        return
      },
      (errMsg, res) => {
        wx.hideLoading()
        console.error('登陆服务器失败:' + errMsg)
        WxApi.showModal({
          title: '提示',
          content: errMsg,
          showCancel: false
        })
      }
    )
  },
  onSubmit: function () {
    this.doRegister()
  },
  hideSendMsg: function () {
    this.setData({
      send: false,
      disabled: true,
      buttonType: 'default'
    })
  },

  sendMsg: function () {
    let that = this;
    WxApi.showLoading({
      title: '请稍等',
      mask: true //是否显示透明蒙层，防止触摸穿透 
    })
    SessionApi.sendSms(that.data.mobile).then((res) => {
      that.setData({
        alreadySend: true,
        send: false
      })
      wx.hideLoading({
        success: (res) => { },
      })
      that.timer();
    }).catch((res) => {
      wx.hideLoading({
        success: (res) => { },
      })
      WxApi.showModal({
        title: '提示',
        content: res,
        showCancel: false
      })
    })
  },
  timer: function () {
    let promise = new Promise((resolve, reject) => {
      let setTimer = setInterval(
        () => {
          this.setData({
            second: this.data.second - 1
          })
          if (this.data.second <= 0) {
            this.setData({
              second: 60,
              alreadySend: false,
              send: true
            })
            resolve(setTimer)
          }
        }
        , 1000)
    })
    promise.then((setTimer) => {
      clearInterval(setTimer)
    })
  },
})
