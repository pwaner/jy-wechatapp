const devicesArr = []
const connected = false
const chs = []

function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}

export function stateBlue() {
  //打开蓝牙适配器
  wx.openBluetoothAdapter({
    success: (res) => {
      console.log('openBluetoothAdapter success', res)
      startBluetoothDevicesDiscovery()
    },
    fail: (res) => {
      if (res.errCode === 10001) {
        wx.onBluetoothAdapterStateChange(function (res) {
          console.log('onBluetoothAdapterStateChange', res)
          if (res.available) {
            startBluetoothDevicesDiscovery()
          }
        })
      }
    }
  })
};
//开始搜索蓝牙设备
function startBluetoothDevicesDiscovery() {
  if (_discoveryStarted) {
    return
  }
  var _discoveryStarted = true  //搜索已开始
  wx.startBluetoothDevicesDiscovery({
    allowDuplicatesKey: false,
    success: (res) => {
      console.log('startBluetoothDevicesDiscovery success', res)
      onBluetoothDeviceFound()
    },
  })
}
//监听寻找到新设备
function onBluetoothDeviceFound() {
  wx.onBluetoothDeviceFound((res) => {
    //console.log(res);
    res.devices.forEach(device => {
      if (!device.name && !device.localName) {
        return
      }
      const foundDevices = devicesArr
      const idx = inArray(foundDevices, 'deviceId', device.deviceId)
      const data = {}
      if (idx === -1) {
        data[`devices[${foundDevices.length}]`] = device
      } else {
        data[`devices[${idx}]`] = device
      }
      devicesArr.push(data);
      console.log(devicesArr);
      //this.setData(data)
    })

  })
}






