// pages/setBell/setCfg.js

import WxApi from '../../api/WxApi'
import Bt2Api from '../../api/Bt2Api'
import ApiState from '../../api/ApiState'
import DeviceAccessApi from '../../api/DeviceAccessApi'
import DeviceApi from '../../api/DeviceApi'
import EstateApi from '../../api/EstateApi'
Page({
  data: {
    device: null,
    estate: null,
    timeOutDiscovery: null,
    searchDeviceArray: null,
    dvAccessList: null,
    dvIndex: -1,
    infoText: '',
    wifissid: '',
    wifipsw: '',
    vol: 0,
    rit: 0,
    ctc: 0,
    estateList: null,
    esIndex: -1
  },

  onLoad: function () {
    let that = this
    that.intCfg()
    /// 测试
    // console.log('setBall onLoad')
    // DeviceAccessApi.getDevices(true).then((subDevices) => {
    //   subDevices = DeviceApi.fillDevice(subDevices, true)
    //   //   subDevices.push({ eid: 0, installPathFull: '' })
    //   that.setData({
    //     dvAccessList: subDevices,
    //     device: subDevices[2],
    //     dvIndex: 2
    //   })
    //   that.getHouses(101)
    // })
  },
  onUnload: function () {
    let that = this
    //  that.closeBLEConnection()
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
      wx.showToast({
        title: this.data.infoText,
      })
    })
    await that.iniEstate().then((res) => {
    }).catch((msg) => {
      that.setData({
        infoText: that.data.infoText + msg + '\n',
      })
    })
    await Bt2Api.getWifissid().then((res) => {
      that.setData({
        wifissid: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: that.data.infoText + '读取wifi名称失败\n',
        wifissid: ''
      })
    })
    await Bt2Api.getWifipsw().then((res) => {
      that.setData({
        wifipsw: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: that.data.infoText + '读取wifi密码失败\n',
        wifipsw: ''
      })
    })
    await Bt2Api.getVol().then((res) => {
      that.setData({
        vol: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: that.data.infoText + '读取音量失败\n',
        vol: 0
      })
    })
    await Bt2Api.getRit().then((res) => {
      that.setData({
        rit: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: that.data.infoText + '读取响铃时间失败\n',
        rit: 0
      })
    })
    await Bt2Api.getCtc().then((res) => { 
      that.setData({
        ctc: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: that.data.infoText + '读取通讯频道失败\n',
        vol: 0
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

  iniEstate: function () {
    let that = this
    return new Promise(function (resolve, reject) {
      Bt2Api.getEstateNum().then((num) => {
        if (that.data.dvIndex == -1) {
          reject("无法获得设备关联物业编号" + num)
        }
        // let deviceEid = that.data.dvAccessList[that.data.dvIndex].eid
        that.getHouses(num)
        resolve(that.data.estate)
      }, (res) => {
        reject("读取户编号失败")
      })

    })
  },

  stopDiscovery: function () {
    Bt2Api.cancelDiscovery()
    wx.hideLoading({
      success: (res) => { }
    })
  },

  dvAccessChange: function (e) {
    let that = this
    that.setData({
      dvIndex: e.detail.value,
      device: that.data.dvAccessList[e.detail.value]
    })
    console.log('dvAccessChange-----------' + JSON.stringify(that.data.device))
    that.getHouses()
  },
  estateChange: function (e) {
    console.log('setBall estateChange')
    let that = this
    let estate = that.data.estateList[e.detail.value]
    this.setData({
      esIndex: e.detail.value,
      estate: estate
    })
  },

  getHouses: function (num) {
    let that = this
    DeviceAccessApi.getCorrelateHouses(that.data.device.eid).then((houses) => {

      if (houses.length > 0) {
        houses = EstateApi.fillEstate(houses)
        that.setData({
          estateList: houses,
        })
        if (num != null) {
          for (let i = 0; i < houses.length; i++) {
            if (houses[i].num == num)
              that.setData({
                estate: houses[i],
                esIndex: i
              })
          }
        }

      } else {
        that.setData({
          estateList: null,
          estate: null,
          esIndex: -1
        })
      }

    }, (res) => {
      that.setData({
        estate: null,
        esIndex: -1,
        estateList: null,
      })
    }
    )
  },



  getWifi: function (e) {
    let that = this
    WxApi.startWifi().then((res) => {
      //console.log(res.errMsg)
      WxApi.getConnectedWifi().then((res) => {
        console.log('res:' + JSON.stringify(res))
        that.setData({
          wifissid: res.wifi.SSID
        })
      }).catch((res) => {
        console.error('res:' + JSON.stringify(res))
        let msg = '无法获取wifi信息'
        if (res.errCode == 12005) {
          msg = '未打开 Wi-Fi 开关'
        } else if (res.errCode == 12006) {
          msg = '未打开 GPS 定位开关'
        }
        WxApi.showModal({
          title: '提示',
          content: msg,
          showCancel: false
        })
        that.setData({
          wifissid: null
        })
      })

    }).catch((res) => {
      console.error('res:' + JSON.stringify(res))
    })

  },



  setting: async function (e) {
    let that = this,
      isOK = true
    //  console.log(JSON.stringify(e.detail.value))

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
    if (that.data.estate == null || that.data.estate.num == null) {
      WxApi.showModal({
        title: '提示',
        content: '户编号不能为空',
        showCancel: false
      })
      return
    }
    await WxApi.showLoading({
      title: '请稍等...',
      mask: true //是否显示透明蒙层，防止触摸穿透
    })
    await Bt2Api.setControlSerial(that.data.device.serial).then((res) => {
      console.log("res:" + res)
      // that.setData({
      //   infoText: that.data.infoText + '设置设备序列号成功' + res + '\n'
      // })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: that.data.infoText + '设置设备序列号失败' + res + '\n'
      })
      isOK = false
    })
    await Bt2Api.setEstateNum(that.data.estate.num).then((res) => {
      console.log("res:" + res)
      // that.setData({
      //   infoText: that.data.infoText + '设置户编号成功' + res + '\n'
      // })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: that.data.infoText + '设置户编号失败' + res + '\n'
      })
      isOK = false
    })

    await Bt2Api.setWifissid(e.detail.value.wifissid).then((res) => {
      console.log("res:" + res)
      // that.setData({
      //   infoText: that.data.infoText + '设置wifi名称成功' + res + '\n'
      // })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: that.data.infoText + '设置wifi名称失败' + res + '\n'
      })
      isOK = false
    })
    await Bt2Api.setWifipsw(e.detail.value.wifipsw).then((res) => {
      console.log("res:" + res)
      // that.setData({
      //   infoText: that.data.infoText + '设置wifi密码成功' + res + '\n'
      // })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: that.data.infoText + '设置wifi密码失败' + res + '\n'
      })
      isOK = false
    })

    await Bt2Api.setVol(e.detail.value.vol).then((res) => {
      console.log("res:" + res)
      // that.setData({
      //   infoText: that.data.infoText + '设置音量成功' + res + '\n'
      // })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: that.data.infoText + '设置音量失败' + res + '\n'
      })
      isOK = false
    })

    await Bt2Api.setRit(e.detail.value.rit).then((res) => {
      console.log("res:" + res)
      // that.setData({
      //   infoText: that.data.infoText + '设置响铃时间成功' + res + '\n'
      // })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: that.data.infoText + '设置响铃时间失败' + res + '\n'
      })
      isOK = false
    })

    await Bt2Api.setCtc(e.detail.value.ctc).then((res) => {
      console.log("res:" + res)
      // that.setData({
      //   infoText: that.data.infoText + '设置响铃时间成功' + res + '\n'
      // })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: that.data.infoText + '设置通讯频道失败' + res + '\n'
      })
      isOK = false
    })

    await Bt2Api.setEnd().then((res) => {
      console.log("res:" + res)
      wx.hideLoading({
        success: (res) => { },
      })
      that.setData({
        infoText: that.data.infoText + '设置保存完成' + res + '\n'
      })
      if (isOK == true) {
        WxApi.navigateBack({
          delta: 1
        })
      }
    }, (res) => {
      console.log("res:" + res)

      that.setData({
        infoText: that.data.infoText + '设置保存失败' + res + '\n'
      })

      wx.hideLoading({
        success: (res) => { },
      })
    })


  },


})