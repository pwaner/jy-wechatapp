import ApiState from './ApiState'

function promisify(api) {
  return (options, ...params) => {
    return new Promise((resolve, reject) => {
      api(
        Object.assign({}, options, {
          success: resolve,
          fail: reject
        }),
        ...params
      )
    })
  }
}
const wxGetSetting = promisify(wx.getSetting)
const wxGetUserInfo = promisify(wx.getUserInfo)
const wxLogin = promisify(wx.login)
const wxRequest = promisify(wx.request)
const wxSwitchTab = promisify(wx.switchTab)
const wxNavigateTo = promisify(wx.navigateTo)
const wxRedirectTo = promisify(wx.redirectTo)
const wxShowToast = promisify(wx.showToast)
const wxNavigateBack = promisify(wx.navigateBack)
const wxShowLoading = promisify(wx.showLoading)
// const wxHideLoading = promisify(wx.hideLoading)
const wxStopPullDownRefresh = promisify(wx.stopPullDownRefresh)
const wxShowModal = promisify(wx.showModal)
const wxSetClipboardData = promisify(wx.setClipboardData)
const wxScanCode = promisify(wx.scanCode)
const wxGetConnectedWifi = promisify(wx.getConnectedWifi)
const wxStartWifi = promisify(wx.startWifi)

//蓝牙
const wxOpenBluetoothAdapter = promisify(wx.openBluetoothAdapter)
const wxStartBluetoothDevicesDiscovery = promisify(
  wx.startBluetoothDevicesDiscovery
)
const wxGetBluetoothAdapterState = promisify(wx.getBluetoothAdapterState)
const wxGetConnectedBluetoothDevices = promisify(
  wx.getConnectedBluetoothDevices
)
const wxStopBluetoothDevicesDiscovery = promisify(
  wx.stopBluetoothDevicesDiscovery
)
const wxCloseBLEConnection = promisify(wx.closeBLEConnection)
const wxCloseBluetoothAdapter = promisify(wx.closeBluetoothAdapter)
const wxCreateBLEConnection = promisify(wx.createBLEConnection)
const wxGetBLEDeviceCharacteristics = promisify(wx.getBLEDeviceCharacteristics)
const wxGetBLEDeviceServices = promisify(wx.getBLEDeviceServices)
const wxNotifyBLECharacteristicValueChange = promisify(
  wx.notifyBLECharacteristicValueChange
)

class WxApi {
  static login() {
    return wxLogin()
  }
  static request(options) {
    return wxRequest(options)
  }

  static restRequest(options) {
    return new Promise(function (resolve, reject) {

      wxRequest(options).then((res) => {
          //  console.log('res：' + JSON.stringify(res))
          if (res.statusCode != 200) {
            if (res.statusCode == 401) {
              WxApi.showModal({
                title: '提示',
                content: '登录超时，请重新登录',
              }).then((res) => {
                if (res.confirm) {
                  ApiState.reSet()
                  wx.reLaunch({
                    url: '../index/index'
                  })
                }
              })
            } else {
              let msg = res.statusCode
              if (res.message != null)
                msg = message
              WxApi.showModal({
                title: '提示',
                content: '网络异常' + msg,
                showCancel: false,
              }).then((res) => {})
            }
          }
          resolve(res)
        })
        .catch((res) => {
          console.log('catch res：' + JSON.stringify(res))
          reject(res)
        })

    })
  }
  //保留当前页面，跳转到应用内的某个页面。但是不能跳到 tabbar 页面。使用 wx.navigateBack 可以返回到原页面。小程序中页面栈最多十层。
  static navigateTo(options) {
    return wxNavigateTo(options)
  }

  //关闭当前页面，跳转到应用内的某个页面。但是不允许跳转到 tabbar 页面
  static redirectTo(options) {
    return wxRedirectTo(options)
  }
  //跳转到 tabBar 页面，并关闭其他所有非 tabBar 页面
  static switchTab(options) {
    return wxSwitchTab(options)
  }
  static showToast(options) {
    return wxShowToast(options)
  }
  static navigateBack(options) {
    return wxNavigateBack(options)
  }
  static showLoading(options) {
    return wxShowLoading(options)
  }

  // static hideLoading() {
  //   return wxHideLoading()
  // }
  static stopPullDownRefresh() {
    return wxStopPullDownRefresh()
  }

  static showModal(options) {
    return wxShowModal(options)
  }
  static setClipboardData(options) {
    return wxSetClipboardData(options)
  }

  static getUserInfo() {
    return new Promise((resolve, reject) => {
      wxGetSetting()
        .then((res) => {
          wxGetUserInfo().then((res) => {
            resolve(res)
          })
        })
        .catch((res) => {
          reject(res)
        })
    })
  }

  static scanCode() {
    return wxScanCode()
  }

  static getConnectedWifi() {
    return wxGetConnectedWifi()
  }

  static startWifi() {
    return wxStartWifi()
  }

  static openBluetoothAdapter() {
    return wxOpenBluetoothAdapter()
  }

  static getBluetoothAdapterState(options) {
    return wxGetBluetoothAdapterState(options)
  }

  static startBluetoothDevicesDiscovery(options) {
    return wxStartBluetoothDevicesDiscovery(options)
  }

  static closeBluetoothAdapter(options) {
    return wxCloseBluetoothAdapter(options)
  }


  static notifyBLECharacteristicValueChange(options) {
    return wxNotifyBLECharacteristicValueChange(options)
  }

  static createBLEConnection(options) {
    return wxCreateBLEConnection(options)
  }

  static getBLEDeviceServices(options) {
    return wxGetBLEDeviceServices(options)
  }

  static getBLEDeviceCharacteristics(options) {
    return wxGetBLEDeviceCharacteristics(options)
  }

  static onBLEConnectionStateChange() {
    wx.onBLEConnectionStateChange(function (res) {
      // 该方法回调中可以用于处理连接意外断开等异常情况
      console.log('BLE连接状态' + JSON.stringify(res))
    })
  }

  static closeBLEConnection(deviceId) {
    console.log('关闭BLE连接deviceId=' + deviceId)
    return wxCloseBLEConnection({
      deviceId: deviceId
    });
  }

  static stopBluetoothDevicesDiscovery(options) {
    return wxStopBluetoothDevicesDiscovery(options)
  }


}

export default WxApi