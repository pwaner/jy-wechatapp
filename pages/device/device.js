import DeviceAccessApi from '../../api/DeviceAccessApi'
import DeviceApi from '../../api/DeviceApi'
import WxApi from '../../api/WxApi'
import ApiState from '../../api/ApiState'
import Bt1Api from '../../api/Bt1Api'
Page({
  data: {
    subDevices: null,
    timeOutDiscovery: null,
    devices: [],
    connected: false
  },
  onLoad: function () {
    let that = this
    that.getDeviceList(false)
    that.openBluetoothAdapter()
  },

  onHide: function () {
    let that = this
    clearInterval(that.data.timeOutDiscovery) //停止定时执行
    that.stopDiscovery()
  },
  onPullDownRefresh: function () {
    let that = this
    that.getDeviceList(true)
  },

  getDeviceList: function (force) {
    let that = this
    DeviceAccessApi.getDevices(force).then((subDevices) => {
      console.log(subDevices);
      for (let i = 0; i < subDevices.length; i++) {
        let installPathFull = DeviceApi.installPathFull(subDevices[i])
        subDevices[i].installPathFull = installPathFull
      }
      that.setData({
        subDevices: subDevices
      })
      WxApi.stopPullDownRefresh()
    })
  },
  //显示开门密码
  getOpenPSW: function (e) {
    let eid = e.currentTarget.dataset.eid
    let installPathFull = e.currentTarget.dataset.installpathfull
    WxApi.showLoading({
      title: '请稍等',
      mask: true //是否显示透明蒙层，防止触摸穿透
    })
    DeviceAccessApi.getVisitorPSW(eid).then(
      (res) => {
        let str =
          installPathFull + ' \n开门密码为“*' + res + '”\n十五分钟内有效。'
        WxApi.showModal({
          title: '开门密码',
          content: str,
          confirmText: '拷贝'
        }).then(
          (res) => {
            if (res.confirm) {
              WxApi.setClipboardData({
                data: str
              }).then((res) => { })
            }
          },
          (res) => {
            if (res.confirm) {
              WxApi.setClipboardData({
                data: str
              })
            }
          }
        )
        wx.hideLoading({
          success: (res) => { }
        })
      },
      (res) => {
        WxApi.showModal({
          title: '开门密码',
          content: res,
          showCancel: false
        })
        wx.hideLoading({
          success: (res) => { }
        })
      }
    )
  },

  openDoor: async function (e) {
    let that = this
    let eid = e.currentTarget.dataset.eid
    ApiState.bleDevice = that.getDevice(eid)
    that.openBluetoothAdapter()  //搜索所有蓝牙设备
    if (ApiState.bleDevice.deviceId) {
      WxApi.navigateTo({
        url: '../openDoor/openDoor'
      })
      return
    }
    //关闭设配器才能清空搜索列表
    await WxApi.closeBluetoothAdapter().then((res) => {
      console.log('关闭蓝牙适配器成功' + JSON.stringify(res))
    })
    await WxApi.showLoading({
      title: '搜索中',
      mask: true //是否显示透明蒙层，防止触摸穿透
    })
    let timeOutDiscovery = setTimeout(function () {
      that.stopDiscovery()
      WxApi.showModal({
        title: '提示',
        content: '找不到设备,请重试',
        showCancel: false
      })
    }, 10000)
    //console.log(timeOutDiscovery)
    that.setData({
      timeOutDiscovery: timeOutDiscovery
    })
    var searchDeviceArray = new Array()
    searchDeviceArray.push(ApiState.bleDevice)
    //传入startDiscovery 的参数必须是公共变量，ios私有变量值不更新。
    await Bt1Api.startDiscovery(searchDeviceArray, null)
      .then((findDevice) => {
        // debugger
        ApiState.bleDevice.deviceId = findDevice.deviceId
        ApiState.bleDevice.RSSI = findDevice.RSSI
        console.log(
          'ApiState.bleDevice-----------' +
          ApiState.bleDevice.eid +
          ',' +
          ApiState.bleDevice.deviceId +
          ',' +
          ApiState.bleDevice.installPathFull
        )
        that.doOpenDoor()
      })
      .catch((msg) => {
        console.log('打开蓝牙适配器失败111' + JSON.stringify(msg))
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

  doOpenDoor: async function () {
    let that = this
    clearInterval(that.data.timeOutDiscovery) //停止定时执行
    await that.stopDiscovery()
    await WxApi.navigateTo({
      url: '../openDoor/openDoor'
    })
  },
  stopDiscovery: function () {
    Bt1Api.cancelDiscovery()
    wx.hideLoading({
      success: (res) => { }
    })
  },

  getDevice: function (eid) {
    let that = this
    for (let i = 0; i < that.data.subDevices.length; i++) {
      if (that.data.subDevices[i].eid == eid) {
        return that.data.subDevices[i]
      }
    }
  },

  //蓝牙业务

  //连接低功耗蓝牙设备
  createBLEConnection(e) {
    const ds = e.currentTarget.dataset
    const deviceId = ds.serial
    const name = ds.installpathfull
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        console.log(res);
        this.setData({
          connected: true,
          name,
          deviceId,
        })
        this.getBLEDeviceServices(deviceId)
      }
    })
    this.stopBluetoothDevicesDiscovery()
  },
  //停止搜寻附近的蓝牙外围设备
  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery()
  },
  //获取蓝牙设备所有服务
  getBLEDeviceServices(deviceId) {
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
        for (let i = 0; i < res.services.length; i++) {
          if (res.services[i].isPrimary) {
            this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
            console.log(deviceId, res.services[i].uuid);
            return
          }
        }
      }
    })
  },
  //获取蓝牙设备某个服务中所有特征值
  getBLEDeviceCharacteristics(deviceId, serviceId) {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => {
        console.log('getBLEDeviceCharacteristics success', res.characteristics)
        /*for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          if (item.properties.read) {
            wx.readBLECharacteristicValue({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
            })
          }
          if (item.properties.write) {
            this.setData({
              canWrite: true
            })
            this._deviceId = deviceId
            this._serviceId = serviceId
            this._characteristicId = item.uuid
            this.writeBLECharacteristicValue()
          }
          if (item.properties.notify || item.properties.indicate) {
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
            })
          }
        }*/
      },
      fail(res) {
        console.error('getBLEDeviceCharacteristics', res)
      }
    })
    // 操作之前先监听，保证第一时间获取数据
    /*wx.onBLECharacteristicValueChange((characteristic) => {
      const idx = inArray(this.data.chs, 'uuid', characteristic.characteristicId)
      const data = {}
      if (idx === -1) {
        data[`chs[${this.data.chs.length}]`] = {
          uuid: characteristic.characteristicId,
          value: ab2hex(characteristic.value)
        }
      } else {
        data[`chs[${idx}]`] = {
          uuid: characteristic.characteristicId,
          value: ab2hex(characteristic.value)
        }
      }
      // data[`chs[${this.data.chs.length}]`] = {
      //   uuid: characteristic.characteristicId,
      //   value: ab2hex(characteristic.value)
      // }
      this.setData(data)
    })*/
  },



  openBluetoothAdapter() {
    var that = this
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        that.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              that.startBluetoothDevicesDiscovery()
            }
          })
        } else {
          wx.showToast({
            title: '请检查蓝牙是否开启',
            icon: 'none',
            duration: 2000
          })
          console.log('openBluetoothAdapter fail', res)
        }
      }
    })
  },
  startBluetoothDevicesDiscovery() {
    if (this._discoveryStarted) {
      return
    }
    this._discoveryStarted = true
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: false,
      success: (res) => {
        console.log('startBluetoothDevicesDiscovery success', res)
        this.onBluetoothDeviceFound()
      },
    })
  },
  onBluetoothDeviceFound() {
    var foucsDevices = this.data.devices
    wx.onBluetoothDeviceFound((res) => {
      res.devices.map((item, index, self) => {
        if (!item.name || !item.localName) {
          return
        } else {
          foucsDevices.push(item);
        }
      })
      console.log(this.data.devices);
      this.setData({
        devices: foucsDevices
      })
    })
  },

})