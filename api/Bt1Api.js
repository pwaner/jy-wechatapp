import UtilApi from './UtilApi'
import WxApi from './WxApi'


let _data = {
  searchDevices: [],
  deviceId: null,
  service: null,
  characteristics: null,
  notifyServicweId: null,
  notifyCharacteristicsId: null,
  writeServicweId: null,
  writeCharacteristicsId: null,
  readServicweId: null,
  readCharacteristicsId: null,
  recvData: '',
  recvState: 'UNKNOWN',
  btCommand: 'UNKNOWN',
  randum: null,//接收到设备的随机码
  dalayTime: 1000,//蓝牙延时时间   不同手机可能时间不同
  startDiscoveryCallback: null,
  subDeviceList: null
}

function addCharacteristics(deviceId, service, characteristics) {
  _data.deviceId = deviceId
  _data.service = service
  _data.characteristics = characteristics
  for (var i = 0; i < characteristics.length; i++) {
    if (characteristics[i].properties.notify) {
      _data.notifyServicweId = service.uuid
      _data.notifyCharacteristicsId = characteristics[i].uuid
    }
    if (characteristics[i].properties.write) {
      _data.writeServicweId = service.uuid
      _data.writeCharacteristicsId = characteristics[i].uuid
    }
    if (characteristics[i].properties.read) {
      _data.readServicweId = service.uuid
      _data.readCharacteristicsId = characteristics[i].uuid
    }
  }
}


function parseRecvData(value) {
  if (_data.btCommand == "HELLO" && value.length == 8) {
    _data.recvState = 'HELLO'
    _data.randum = value.substr(2, 6);
    //   console.log('收到HELLO应答:' + _data.randum)
    return
  }
  if (_data.btCommand == "WP" && value.length == 4) {
    //  debugger
    //  console.log('收到WP应答:' + value)
    if (value.indexOf('OK') >= 0) {
      _data.recvState = 'OK'
      //   console.log('parseRecvData recvState:' + _data.recvState)
      return
    }
    if (value.indexOf('NG') == 2 || value.indexOf('spng') == 2) {
      _data.recvState = 'FAIL'
      return
    }
    if (value.indexOf('LPNG') == 2) {
      _data.recvState = 'RETRY'
      return
    }
  }
}

function onDataChange(value) {
  let hex = UtilApi.arrayBufferToHexString(value)
  let text = UtilApi.hexCharCodeToStr(hex)
  console.log('收到数据:' + text)
  _data.recvData += text
  parseRecvData(_data.recvData)
}
function startBLEListener() {
  wx.onBLECharacteristicValueChange(function (res) {
    // console.log('收到输入数据变化' + JSON.stringify(res))
    onDataChange(res.value)
    //console.log(ab2hex(res.value))
  })
}
//启用低功耗蓝牙设备特征值变化时的 notify 功能
function notifyBLECharacteristicValueChange() {
  return new Promise((resolve, reject) => {
    let options = {
      state: true, // 启用 notify 功能
      deviceId: _data.deviceId,
      serviceId: _data.notifyServicweId,
      characteristicId: _data.notifyCharacteristicsId
    }
    //console.log('启用输入监听' + JSON.stringify(options))
    WxApi.notifyBLECharacteristicValueChange(options)
      .then((res) => {
        //   console.log('输入监听已经启用' + JSON.stringify(res))
        resolve(res)
      })
      .catch((res) => {
        reject(res.errMsg)
      })
  })
}

//分次发，20个字节一次
function doSendContent(utfstr) {
  console.log('doSendContent:' + utfstr)
  let index = 0;
  let promise = new Promise((resolve, reject) => {
    let setTimer = setInterval(
      () => {
        let str = "";
        let len = 0;
        if (utfstr.length - index >= 20) {
          len = 20;
        } else {
          len = utfstr.length - index;
        }
        console.log('index:' + index + ',' + 'len:' + len)
        str = utfstr.substr(index, len);
        send(str);
        index = index + len;
        if (index >= utfstr.length) {
          clearInterval(setTimer)
          resolve(setTimer);
        }
      }
      , 50)
  })


  promise.then(() => {
    console.log('doSendContent:' + utfstr + ' 发送完成')

  })
}
//发送信息到蓝牙设备
function send(utfstr) {
  //debugger // 语句类似于在代码中设置断点。
  if (utfstr.length == 0) {
    console.log('sendStr为空 不发送')
    return
  }
  _data.lastReadTime = 0
  _data.readByteLen = 0
  //.log('utfstr.length:' + utfstr.length)
  var buffer = new ArrayBuffer(utfstr.length)
  var bufView = new Uint8Array(buffer)
  for (var i = 0, strlen = utfstr.length; i < strlen; i++) {
    bufView[i] = utfstr.charCodeAt(i)
  }
  console.log('sendStr:' + utfstr)
  console.log('send:' + bufView)
  wx.writeBLECharacteristicValue({
    deviceId: _data.deviceId,
    serviceId: _data.writeServicweId,
    characteristicId: _data.writeCharacteristicsId,
    value: buffer,
    success: (res) => {
      console.log(res);
    },
    fail: (res) => { }
  })
}

class Bt1Api {

  static openBle(deviceId) {
    return new Promise((resolve, reject) => {
      console.log('连接蓝牙设备deviceId=:' + deviceId)
      WxApi.createBLEConnection({ deviceId: deviceId })
        .then((res) => {
          console.log('连接蓝牙设备成功')
          WxApi.getBLEDeviceServices({ deviceId: deviceId }).then((res) => {
            //   console.log('获取设备服务' + JSON.stringify(res))
            var service = res.services[0]
            WxApi.getBLEDeviceCharacteristics({
              deviceId: deviceId,
              serviceId: service.uuid
            }).then((res) => {
              //    console.log('获取输入输出缓存' + JSON.stringify(res))
              addCharacteristics(deviceId, service, res.characteristics)
              notifyBLECharacteristicValueChange().then((res) => {
                startBLEListener()
                resolve(res)
              })
            })
          })
        })
        .catch((res) => {
          console.log('蓝牙创建失败' + JSON.stringify(res))
          reject('蓝牙创建失败')
        })
    })
  }
  // static wxOnBLEConnectionStateChange() {
  //   wx.onBLEConnectionStateChange(function (res) {
  //     // 该方法回调中可以用于处理连接意外断开等异常情况
  //     console.log('BLE连接状态' + JSON.stringify(res))
  //   })
  // }

  // static closeBLEConnection(deviceId) {
  //   console.log('关闭BLE连接deviceId=' + deviceId)
  //   return wxCloseBLEConnection({ deviceId: deviceId });
  // }


  static hello() {
    _data.recvData = ''
    _data.recvState = ''
    _data.randum = null
    return new Promise((resolve, reject) => {
      _data.btCommand = 'HELLO'
      doSendContent(_data.btCommand)
      let count = 0
      //定时执行
      let helloSetInterval = setInterval(function () {
        count++
        //  console.log('hello _data.recvState:' + _data.recvState)
        if (count >= 10) {
          clearInterval(helloSetInterval)
          reject('超时无应答')
        }
        if (_data.recvState == 'HELLO') {
          clearInterval(helloSetInterval)//停止定时执行
          resolve(_data.randum)
        }
      }, 500)

    })

  }
  static openDoor(accessciphertext) {
    _data.recvData = ''
    _data.recvState = ''
    _data.randum = null
    return new Promise((resolve, reject) => {
      _data.btCommand = 'WP'
      let sendData = _data.btCommand + ':' + accessciphertext;
      //   console.log('开门指令' + sendData)
      //  let sendData = 'WP:GDCQf7G52K5WoO9VHY76nU+1BJdqwh8O'
      doSendContent(sendData)
      let count = 0
      let openSetInterval = setInterval(function () {
        count++
        // console.log('openDoor _data.recvState:' + _data.recvState)
        if (count >= 10) {
          clearInterval(openSetInterval)
          reject('超时无应答')
        }
        if (_data.recvState == 'OK') {
          clearInterval(openSetInterval);
          console.log("开门成功");
          resolve('开门成功')
        } else if (_data.recvState == 'FAIL') {
          clearInterval(openSetInterval);
          console.log("开门失败");
          reject('开门失败')
        }
      }, 500)

    })
  }
  static cancelDiscovery() {
    return new Promise((resolve, reject) => {
      WxApi.getBluetoothAdapterState().then((res) => {
        console.log('获取蓝牙适配器状态:' + JSON.stringify(res))
        let adapterAvailable = res.available
        let adapterDiscovering = res.discovering
        //   console.log('蓝牙适配器是否可以使用:' + (adapterAvailable ? '是' : '否'))
        //   console.log('蓝牙适配器是否正在搜索:' + (adapterDiscovering ? '是' : '否'))
        if (adapterAvailable && adapterDiscovering) {
          WxApi.stopBluetoothDevicesDiscovery().then((res) => {
            resolve(res)
          }).catch((res) => {
            reject(res)
          })
        }
      })
    })
  }


  //微信小程序 android6.0手机需要开启位置服务，否则扫描不到设备
  //android手机使用小程序的BLE模块，广播中的deviceId表示设备的mac信息，ios系统则是手机mac和设备mac加密产生的uuid值！
  //连接设备也如此：安卓直接使用mac进行连接操作；但ios使用广播中读取到的UUID进行连接。
  //注意 IOS wxStartBluetoothDevicesDiscovery中的callback和 subDeviceList无法传递,需要用公用变量
  static startDiscovery(subDeviceList, callback) {
    //  console.log('startDiscovery subDeviceList:' + JSON.stringify(subDeviceList))
    _data.startDiscoveryCallback = callback
    _data.subDeviceList = subDeviceList
    return new Promise((resolve, reject) => {

      //console.log("callback=" + _data.startDiscoveryCallback);
      WxApi.openBluetoothAdapter()
        .then((res) => {
          console.log('打开蓝牙适配器成功')
          WxApi.getBluetoothAdapterState().then((res) => {
            console.log('获取蓝牙适配器状态:' + JSON.stringify(res))
            let adapterAvailable = res.available
            let adapterDiscovering = res.discovering
            //   console.log('蓝牙适配器是否可以使用:' + (adapterAvailable ? '是' : '否'))
            //   console.log('蓝牙适配器是否正在搜索:' + (adapterDiscovering ? '是' : '否'))
            if (adapterAvailable && !adapterDiscovering) {
              WxApi.startBluetoothDevicesDiscovery(
              ).then((res) => {
                //    console.log(JSON.stringify(res))
                wx.onBluetoothDeviceFound(function (res) {
                  //   console.log(res);
                  for (let i = 0; i < res.devices.length; i++) {
                    let name = res.devices[i].localName;
                    //console.log('localName:' + name);
                    if (name == null) {
                      continue
                    }
                    let per = name.substr(0, 2);
                    //  console.log("per:" + per);
                    if (per != "nk") {
                      continue;
                    }
                    let shortMac = name.substr(name.length - 6, 6);
                    //  console.log("shortMac:" + shortMac);
                    var findDeviceId = res.devices[i].deviceId;
                    //    console.log(i + " (res.devices[i].deviceId)" + findDeviceId);
                    var findRSSI = res.devices[i].RSSI;
                    for (var j = 0; j < _data.subDeviceList.length; j++) {
                      let TargetShortMac = _data.subDeviceList[j].serial.substr(_data.subDeviceList[j].serial.length - 6, 6)
                      //   console.log("TargetShortMac:" + TargetShortMac);
                      if (shortMac == TargetShortMac) {
                        console.log("machfindDeviceId:" + findDeviceId);
                        console.log("machfindDevicePath:" + _data.subDeviceList[j].installPath);
                        //    console.log("找到设备" + JSON.stringify(res.devices[j]));
                        let device = {
                          deviceId: findDeviceId,
                          subDevice: _data.subDeviceList[j],
                          RSSI: findRSSI
                        }
                        //  console.log('subDeviceList:' + JSON.stringify(_data.subDeviceList[j]))
                        //  console.log("wxStartBluetoothDevicesDiscovery callback=" + _data.startDiscoveryCallback);
                        if (_data.startDiscoveryCallback == null) {
                          resolve(device)
                          return
                        }

                        _data.startDiscoveryCallback(device);

                      }
                    }
                  }
                })
              })
            }
          })
        })
        .catch((res) => {
          //   console.log('打开蓝牙适配器失败' + JSON.stringify(res))
          reject("打开蓝牙适配器失败,请启动蓝牙")
        })
    })
  }


  static startDiscoveryBySufBtName(subDeviceList, callback) {
    _data.startDiscoveryCallback = callback
    _data.subDeviceList = subDeviceList
    return new Promise((resolve, reject) => {
      WxApi.openBluetoothAdapter()
        .then((res) => {
          console.log('打开蓝牙适配器成功')
          WxApi.getBluetoothAdapterState().then((res) => {
            console.log('获取蓝牙适配器状态:' + JSON.stringify(res))
            let adapterAvailable = res.available
            let adapterDiscovering = res.discovering
            if (adapterAvailable && !adapterDiscovering) {
              WxApi.startBluetoothDevicesDiscovery(
              ).then((res) => {
                wx.onBluetoothDeviceFound(function (res) {
                  for (let i = 0; i < res.devices.length; i++) {
                    let name = res.devices[i].localName;
                    console.log('localName:' + name);
                    if (name == null) {
                      continue
                    }
                    let per = name.substr(0, 2);
                    if (per != "nk" && per != "Nk") {
                      continue;
                    }
                    //  let shortMac = name.substr(name.length - 6, 6);
                    //  console.log("shortMac:" + shortMac);
                    var findDeviceId = res.devices[i].deviceId;
                    var findRSSI = res.devices[i].RSSI;
                    for (var j = 0; j < _data.subDeviceList.length; j++) {
                      let shortMac = name.substr(name.length - _data.subDeviceList[j].sufBtName.length, _data.subDeviceList[j].sufBtName.length);
                      console.log("shortMac:" + shortMac);
                      let TargetShortMac = _data.subDeviceList[j].sufBtName
                      console.log("TargetShortMac:" + TargetShortMac);
                      if (shortMac == TargetShortMac) {
                        console.log("machfindDeviceId:" + findDeviceId);
                        console.log("machfindDevicePath:" + _data.subDeviceList[j].installPath);
                        //    console.log("找到设备" + JSON.stringify(res.devices[j]));
                        let device = {
                          deviceId: findDeviceId,
                          subDevice: _data.subDeviceList[j],
                          RSSI: findRSSI
                        }
                        if (_data.startDiscoveryCallback == null) {
                          resolve(device)
                          return
                        }

                        _data.startDiscoveryCallback(device);

                      }
                    }
                  }
                })
              })
            }
          })
        })
        .catch((res) => {
          //   console.log('打开蓝牙适配器失败' + JSON.stringify(res))
          reject("打开蓝牙适配器失败,请启动蓝牙")
        })
    })
  }

  // static closeAdapter() {
  //   return WxApi.closeBluetoothAdapter()
  // }
}
export default Bt1Api
