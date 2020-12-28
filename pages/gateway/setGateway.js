// pages/setBell/setCfg.js

import WxApi from '../../api/WxApi'
import Bt3Api from '../../api/Bt3Api'
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
    //网关
    nwy: ['LAN', 'MOBILE', 'WIFI'],
    currentNwy: 'WIFI',
    dhcp: ['YES', 'NO'],
    currentDhcp: 'YES',
    ipAddress: '',
    gatewayAddress: '',
    netmask: '',
    dns: '',
    estateList: null,
    esIndex: -1,
    isShow: false
  },
  nwyChange(e) {
    // console.log(e);
    this.setData({
      currentNwy: this.data.nwy[e.detail.value]
    })
  },
  dhcpChange(e) {
    this.setData({
      currentDhcp: this.data.dhcp[e.detail.value]
    })
  },
  onLoad: function () {
    let that = this
    that.intCfg()
  },
  onUnload: function () {
    let that = this
  },
  intCfg: async function () {
    let that = this
    that.setData({
      infoText: '读取中......',
    })
    // 读取上网方式
    await Bt3Api.getNwy().then((res) => {
      that.setData({
        currentNwy: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: '读取上网方式失败 \n',
        currentNwy: 'WIFI'
      })
    })
    // 读取DHCP
    await Bt3Api.getDhc().then((res) => {
      that.setData({
        currentDhcp: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: '读取DHCP失败 \n',
        currentDhcp: 'YES'
      })
    })
    // 读取wifi名称
    await Bt3Api.getWifissid().then((res) => {
      that.setData({
        wifissid: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: '读取wifi名称失败\n',
        wifissid: '',
      })
    })
    // 读取wifi密码
    await Bt3Api.getWifipsw().then((res) => {
      that.setData({
        infoText: '读取wifi密码成功',
        wifipsw: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: '读取wifi密码失败',
        wifipsw: ''
      })
    })
    // 读取ip地址
    await Bt3Api.getNip().then((res) => {
      that.setData({
        infoText: '读取ip地址成功',
        ipAddress: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: '读取ip地址失败',
        ipAddress: ''
      })
    })
    // 读取网关
    await Bt3Api.getNgw().then((res) => {
      that.setData({
        infoText: '读取网关成功',
        gatewayAddress: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: '读取网关失败',
        gatewayAddress: ''
      })
    })
    // 读取子网掩码
    await Bt3Api.getNms().then((res) => {
      that.setData({
        infoText: '读取子网掩码成功',
        netmask: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: '读取子网掩码失败\n',
        netmask: ''
      })
    })
    // 读取DNS
    await Bt3Api.getDns().then((res) => {
      that.setData({
        infoText: '读取DNS成功',
        dns: res
      })
    }).catch((msg) => {
      that.setData({
        infoText: '读取DNS失败\n',
        dns: ''
      })
    })
    setTimeout(() => {
      that.setData({
        isShow: true,
      })
    }, 1500)

  },
  iniDevice: function () {
    let that = this
    return new Promise(function (resolve, reject) {
      DeviceAccessApi.getDevices(true).then((subDevices) => {
        subDevices = DeviceApi.fillDevice(subDevices, true)
        that.setData({
          dvAccessList: subDevices,
        })
        Bt3Api.getControlSerial().then((res) => {
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
      Bt3Api.getEstateNum().then((num) => {
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
    Bt3Api.cancelDiscovery()
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
    console.log(e);

    if (ApiState.bleDevice == null) {
      WxApi.showModal({
        title: '提示',
        content: '未连接设备',
        showCancel: false
      })
      return
    }

    await that.setData({
      infoText: '请稍后......',
      isShow: false
    })

    await Bt3Api.setNwy(this.data.currentNwy).then((res) => {
      that.setData({ infoText: '上网方式保存成功' })
    }, (res) => {
      that.setData({
        infoText: '设置上网方式失败' + res
      })
      isOK = false
    })

    await Bt3Api.setDhc(this.data.currentDhcp).then((res) => {
      that.setData({ infoText: 'DHCP保存成功' })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: '设置DHCP失败' + res
      })
      isOK = false
    })

    await Bt3Api.setWifissid(e.detail.value.wifissid).then((res) => {
      that.setData({ infoText: 'wifi名称保存成功' })
      console.log("res:" + res)
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: '设置wifi名称失败' + res
      })
      isOK = false
    })
    await Bt3Api.setWifipsw(e.detail.value.wifipsw).then((res) => {
      that.setData({ infoText: 'wifi密码保存成功' })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: '设置wifi密码失败' + res
      })
      isOK = false
    })
    await Bt3Api.setNip(e.detail.value.ipAddress).then((res) => {
      that.setData({ infoText: 'IP地址保存成功' })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: '设置IP地址失败' + res
      })
      isOK = false
    })

    await Bt3Api.setNgw(e.detail.value.gatewayAddress).then((res) => {
      that.setData({ infoText: '网关地址保存成功' })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: '设置网关地址失败' + res
      })
      isOK = false
    })

    await Bt3Api.setNms(e.detail.value.netmask).then((res) => {
      that.setData({ infoText: '子网掩码保存成功' })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: '设置子网掩码失败' + res
      })
      isOK = false
    })

    await Bt3Api.setDns(e.detail.value.dns).then((res) => {
      that.setData({ infoText: 'DNS保存成功' })
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: '设置DNS失败' + res
      })
      isOK = false
    })

    await Bt3Api.setEnd().then((res) => {
      console.log("res:" + res)
      that.setData({
        infoText: '设置保存完成' + res,
        isShow: true
      })
      if (isOK == true) {
        WxApi.navigateBack({
          delta: 1
        })
      }
    }, (res) => {
      console.log("res:" + res)
      that.setData({
        infoText: '设置保存失败' + res,
        isShow: true
      })
    })
  },
})