function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}

Page({
  data: {
    devices: [],
    connected: false,
    chs: [],
    dialogShow: false
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
      this.setData({
        devices: foucsDevices
      })
    })
  },

  onLoad: function (options) {
    this.openBluetoothAdapter()
  },
  onReady: function () {

  },
  onShow: function () {

  },
  onHide: function () {

  },
  onUnload: function () {

  },
  onPullDownRefresh: function () {

  },
  onReachBottom: function () {

  },
  onShareAppMessage: function () {

  }
})