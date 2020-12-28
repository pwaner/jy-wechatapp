import DeviceAccessApi from '../../api/DeviceAccessApi'
import Bt1Api from '../../api/Bt1Api'
import WxApi from '../../api/WxApi'
import ApiState from '../../api/ApiState'
import DeviceApi from '../../api/DeviceApi'

var searchDeviceArray = new Array()
Page({
  data: {
    subDevices: null,
    searchDeviceList: null
  },
  onLoad: function () {
    let that = this
    that.searchBtn()
  },
  onHide: function () {

    let that = this;
    that.stopDiscovery();

  },

  searchBtn: async function () {
    let that = this
    await DeviceAccessApi.getDevices(false).then((subDevices) => {
      that.setData({
        subDevices: subDevices
      })
      console.log('subDevices：' + JSON.stringify(subDevices))
    })
    if (that.data.subDevices == null) {
      console.log('没有门禁列表')
      return;
    }
    that.setData({
      searchDeviceList: null
    })
    searchDeviceArray = new Array()
    //关闭设配器才能清空搜索列表
    await WxApi.closeBluetoothAdapter().then((res) => {
      console.log('关闭蓝牙适配器成功' + JSON.stringify(res))
    })
    await WxApi.showLoading({
      title: '搜索中',
    });
    setTimeout(function () {
      wx.hideLoading({
        success: (res) => {},
      })
      that.stopDiscovery();
    }, 20000)
    await Bt1Api.startDiscovery(that.data.subDevices, that.addDeviceListView).then((devices) => {
      // console.log('搜索门禁设备:' + JSON.stringify(devices))
    }).catch((msg) => {
      //  console.log('打开蓝牙适配器失败111' + JSON.stringify(msg))
      wx.hideLoading({
        success: (res) => {},
      })
      WxApi.showModal({
        title: '提示',
        content: msg,
        showCancel: false
      })
    })
  },

  addDeviceListView: function (findDevice) {
    let that = this
    let installPathFull = DeviceApi.installPathFull(findDevice.subDevice)
    let device = {
      deviceId: findDevice.deviceId,
      RSSI: findDevice.RSSI,
      serial: findDevice.subDevice.serial,
      eid: findDevice.subDevice.eid,
      installPathFull: installPathFull
    }
    searchDeviceArray.push(device)
    that.setData({
      searchDeviceList: searchDeviceArray,
      infoText: that.data.infoText + '找到设备\n'
    })
  },
  stopDiscovery: function () {
    // TODO  老报错，有问题 
    //  WxApi.hideLoading()
    wx.hideLoading({
      success: (res) => {},
    })
    Bt1Api.cancelDiscovery().then((res) => {
      console.log('停止蓝牙设备搜索' + JSON.stringify(res))
    })
  },

  openDoor: async function (e) {
    let that = this
    //e.currentTarget.dataset 默认全部都是小写
    let installPathFull = e.currentTarget.dataset.installpathfull
    let serial = e.currentTarget.dataset.serial
    let deviceId = e.currentTarget.dataset.deviceid
    let eid = e.currentTarget.dataset.eid
    ApiState.bleDevice = {
      installPathFull: installPathFull,
      serial: serial,
      deviceId: deviceId,
      eid: eid
    }
    await that.stopDiscovery();
    await WxApi.navigateTo({
      url: '../openDoor/openDoor'
    })
  },
})