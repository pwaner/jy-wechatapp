
import WxApi from '../../api/WxApi'
import Bt2Api from '../../api/Bt2Api'
import ApiState from '../../api/ApiState'
import DeviceAccessApi from '../../api/DeviceAccessApi'
import DeviceApi from '../../api/DeviceApi'
import EstateApi from '../../api/EstateApi'


Page({
  data: {
    infoText: '',
    sufBtName: '',
    device: null,
    timeOutDiscovery: null,
    searchDeviceArray: null,
    searchDisabled: true,
    setDisabled: true
  },
  onLoad: function () {
    let that = this
  },
  onUnload: function () {
    let that = this
    console.log('onUnload')
    that.closeBLEConnection()
  },
  bindKeyInput: function (e) {
    let that = this
    let searchDeviceArray = new Array()
    let obj = {
      serial: '',
      sufBtName: e.detail.value,
      perBtName: ''
    }
    searchDeviceArray.push(obj)
    console.log(searchDeviceArray);
    that.setData({
      // infoText: that.data.infoText + '扫码成功，设备序列号：' + obj.serial + '\n',
      searchDisabled: false,
      device: obj,
      searchDeviceArray: searchDeviceArray
    })
  },

  //二维码格式 000E47052205, 052205,nklr
  scanCode: async function () {
    let that = this
    let searchDeviceArray = new Array()
    that.setData({
      searchDisabled: true,
      setDisabled: true,
      device: null,
      searchDeviceArray: searchDeviceArray
    })
    await WxApi.scanCode().then((res) => {
      console.log('scanCode' + JSON.stringify(res.result))
      let args = res.result.split(',')
      //   let obj = JSON.parse(res.result); //可以将json字符串转换成json对象
      let obj = {
        serial: args[0],
        sufBtName: args[1],
        perBtName: args[2],
      }
      if (obj.serial == null) {
        that.setData({
          infoText: that.data.infoText + '找不到设备序列号\n',
        })
        return
      }
      searchDeviceArray.push(obj)
      that.setData({
        infoText: that.data.infoText + '扫码成功，设备序列号：' + obj.serial + '\n',
        searchDisabled: false,
        device: obj,
        sufBtName: obj.sufBtName,
        searchDeviceArray: searchDeviceArray
      })
    }).catch((res) => {
        that.setData({
          infoText: that.data.infoText + '扫码失败\n',
        })
      })
  },
  searchDevice: async function () {
    let that = this 
    WxApi.showLoading({
      title: '请稍等...',
      mask: true //是否显示透明蒙层，防止触摸穿透
    })
    await WxApi.closeBluetoothAdapter().then((res) => {
      console.log('关闭蓝牙适配器成功' + JSON.stringify(res))
    })
    let timeOutDiscovery = setTimeout(function () {
      that.stopDiscovery()
      that.setData({
        infoText: that.data.infoText + '找不到设备\n'
      })
    }, 10000)
    that.setData({
      timeOutDiscovery: timeOutDiscovery
    })
    that.setData({
      infoText: that.data.infoText + '搜索设备...\n',
      setDisabled: true,
    })
    //传入startDiscovery 的参数必须是公共变量，ios私有变量值不更新。
    await Bt2Api.startDiscoveryBySufBtName(that.data.searchDeviceArray, null)
      .then((findDevice) => {
        //   console.log('BELL-----------' + findDevice.deviceId)
        ApiState.bleDevice = that.data.device
        ApiState.bleDevice.deviceId = findDevice.deviceId
        ApiState.bleDevice.RSSI = findDevice.RSSI
        clearInterval(that.data.timeOutDiscovery) //停止定时执行
        Bt2Api.cancelDiscovery()
        that.setData({
          infoText: that.data.infoText + '找到设备\n'
        })
        console.log(' startOpenDoor ApiState.bleDevice-----------' + ApiState.bleDevice.eid + ',' + ApiState.bleDevice.deviceId + ',' + ApiState.bleDevice.installPathFull)
        that.setData({
          infoText: that.data.infoText + '连接设备...\n'
        })
        Bt2Api.openBle(ApiState.bleDevice.deviceId).then((res) => {
          console.log('连接设备成功')
          that.setData({
            infoText: that.data.infoText + '连接设备成功\n'
          })
          Bt2Api.login().then((res) => {
            console.log('login' + JSON.stringify(res))
            that.setData({
              setDisabled: false,
              infoText: that.data.infoText + '版本号:' + res + '\n'
            }) 
            wx.hideLoading({
              success: (res) => { }
            })
          }, (res) => {
            that.setData({
              infoText: that.data.infoText + '登录设备失败\n'
            })
            wx.hideLoading({
              success: (res) => { }
            })
          })
        }, (res) => {
          that.setData({
            infoText: that.data.infoText + res + '\n'
          })
          that.closeBLEConnection()
          wx.hideLoading({
            success: (res) => { }
          })
        })
      })
      .catch((msg) => {
        WxApi.showModal({
          title: '提示',
          content: msg,
          showCancel: false
        })
        wx.hideLoading({
          success: (res) => { }
        })
      })
  },

  stopDiscovery: function () {
    Bt2Api.cancelDiscovery()
    wx.hideLoading({
      success: (res) => { }
    })
  },
  setCfg: function () {
    WxApi.navigateTo({
      url: '../setBell/setCfg'
    })
  },
  relieveDevice: function () {
    WxApi.navigateTo({
      url: '../setBell/relieveDevice'
    })
  },

  closeBLEConnection: function () {
    var that = this
    if (ApiState.bleDevice == null || ApiState.bleDevice.deviceId == null)
      return
    WxApi.closeBLEConnection(ApiState.bleDevice.deviceId
    ).then((res) => {
      console.log(' 关闭蓝牙链接成功')
    },
      (res) => {
        console.log('关闭蓝牙链接失败' + JSON.stringify(res))
      })
  },
})
