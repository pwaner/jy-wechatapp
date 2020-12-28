// pages/setBell/relieveDevice.js

import WxApi from '../../api/WxApi'
import Bt2Api from '../../api/Bt2Api'
import ApiState from '../../api/ApiState'
import DeviceAccessApi from '../../api/DeviceAccessApi'
import DeviceApi from '../../api/DeviceApi'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    device: null,
    dvAccessList: null,
    dvIndex: -1,
    infoText: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    let that = this
    that.intCfg()
    // / 测试
    // console.log('relieveDevice onLoad')
    // DeviceAccessApi.getDevices(true).then((subDevices) => {
    //   subDevices = DeviceApi.fillDevice(subDevices, true)
    //   that.setData({
    //     dvAccessList: subDevices,
    //     device: subDevices[0]
    //   })
    // })


  },



  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    let that = this
    // that.closeBLEConnection()
  },
  intCfg: async function () {
    let that = this
    WxApi.showLoading({
      title: '读取中...',
      mask: true //是否显示透明蒙层，防止触摸穿透
    })
    await that.iniDevice().then((res) => {
    }).catch((msg) => {
      that.setData({
        infoText: that.data.infoText + msg + '\n',
      })
    })
    wx.hideLoading({
      success: (res) => { }
    })
  },
  iniDevice: function () {
    let that = this
    return new Promise(function (resolve, reject) {
      DeviceAccessApi.getDevices(true).then((subDevices) => {
        subDevices = DeviceApi.fillDevice(subDevices, true)
        that.setData({
          dvAccessList: subDevices,
        })
        Bt2Api.getControlSerial().then((res) => {

          let index = DeviceApi.findDevicesBySerial(subDevices, res)
          console.log('index :' + index)
          if (index == -1) {
            that.setData({
              dvIndex: index,
              device: null
            })
            reject("后台没有该设备：" + res)
          } else {
            that.setData({
              dvIndex: index,
              device: subDevices[index]
            })
            resolve(that.data.device)
          }
        }, (res) => {
          //   console.log('getControlSerial 失败:' + res)
          reject("读取设备序列号失败")
        })
      }, (res) => {
        reject(res)
      })
    })
  },
  dvAccessChange: function (e) {
    let that = this
    that.setData({
      dvIndex: e.detail.value,
      device: that.data.dvAccessList[e.detail.value]
    })
    console.log('dvAccessChange-----------' + JSON.stringify(that.data.device))

  },
  setting: async function (e) {
    var that = this
    // console.log('setting-----------' + JSON.stringify(ApiState.bleDevice))
    // console.log('setting-----------' + JSON.stringify(that.data.device))
    if (ApiState.bleDevice == null) {
      WxApi.showModal({
        title: '提示',
        content: '未连接设备',
        showCancel: false
      })
      return
    }
    if (that.data.device == null || that.data.device.serial == null) {
      WxApi.showModal({
        title: '提示',
        content: '门禁不能为空',
        showCancel: false
      })
      return
    }
    await WxApi.showLoading({
      title: '请稍等...',
      mask: true //是否显示透明蒙层，防止触摸穿透
    })
    console.log('that.data.device.serial-----------' + JSON.stringify(that.data.device.serial))
    await Bt2Api.delControlSerial(that.data.device.serial).then((res) => {
      console.log("res:" + res)
      that.setData({
        infoText: that.data.infoText + '解绑设备成功' + res + '\n'
      })
      wx.hideLoading({
        success: (res) => { },
      })
      WxApi.navigateBack({
        delta: 1
      })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: that.data.infoText + '解绑设备失败' + res + '\n'
      })
      wx.hideLoading({
        success: (res) => { },
      })
    })
  }
})