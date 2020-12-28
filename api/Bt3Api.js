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
  recvData: '',//接收数据
  recvContent: '',//接收内容
  recvState: 'UNKNOWN',//接收状态
  recvCommand: 'UNKNOWN',//接收的命令
  sendCommand: 'UNKNOWN',//发送的命令
  sendContent: '',//发送的内容
  dalayTime: 1000,//蓝牙延时时间   不同手机可能时间不同
  startDiscoveryCallback: null,
  subDeviceList: null
}

let _cmd = {
  login: 'LOGIN',
  logout: 'LOGOUT',
  setSerial: 'S+MAC',
  delSerial: 'D+MAC',
  setEstateNum: 'S+RMN',
  setWifissid: 'S+WFS',
  setWifipsw: 'S+WFP',
  setVol: 'S+VOL',
  setRit: 'S+RIT',
  setCtc: 'S+CTC',
  setEnd: 'S+END',
  //小网关
  setNwy: 'G+NWY',
  setDhcp: 'G+DHC',
  setNip: 'G+NIP',
  setNgw: 'G+NGW',
  setNms: 'G+NMS',
  setDns: 'G+DNS',

  getSerial: 'G+MAC',
  getEstateNum: 'G+RMN',
  getWifissid: 'G+WFS',
  getWifipsw: 'G+WFP',
  getVol: 'G+VOL',
  getRit: 'G+RIT',
  getCtc: 'G+CTC',
  //小网关
  getNwy: 'G+NWY',
  getDhcp: 'G+DHC',
  getNip: 'G+NIP',
  getNgw: 'G+NGW',
  getNms: 'G+NMS',
  getDns: 'G+DNS',

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
  console.log('总收到数据:' + value)
  let endIndex = value.indexOf('\n')
  let btCommandIndex = value.indexOf(':')
  if (endIndex == -1 || btCommandIndex == -1) { return }
  if (value.indexOf('OK') == 0) { _data.recvState = 'OK' }
  else if (value.indexOf('NG') == 0) { _data.recvState = 'NG' }
  else { _data.recvCommand = value.substr(0, btCommandIndex - 1) }

  _data.recvContent = value.substr(btCommandIndex + 1, endIndex - btCommandIndex - 1);
  console.log('收到数据_data.recvState:' + _data.recvState)
  console.log('收到数据_data.recvCommand:' + _data.recvCommand)
  console.log('收到数据_data.recvContent:' + _data.recvContent)
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
  let index = 0;
  new Promise((resolve, reject) => {
    let setTimer = setInterval(() => {
      let str = "";
      let len = 0;
      len = utfstr.length - index >= 20 ? 20 : utfstr.length - index;
      //console.log('index:' + index + ',' + 'len:' + len)
      str = utfstr.substr(index, len);
      send(str);
      index = index + len;
      if (index >= utfstr.length) {
        clearInterval(setTimer)
        resolve(setTimer);
      }
    }, 50)
  }).then(() => {
    console.log('doSendContent:' + utfstr + ' 发送完成')
  })
}

function send(utfstr) {
  if (utfstr.length === 0) {
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
  // console.log('send:' + bufView)
  wx.writeBLECharacteristicValue({
    deviceId: _data.deviceId,
    serviceId: _data.writeServicweId,
    characteristicId: _data.writeCharacteristicsId,
    value: buffer,
    success: function (res) {
      console.log(res)
    },
    fail: function (res) {
      console.log(res)
    }
  })
}

function cleanRecv() {
  _data.recvData = ''
  _data.recvContent = ''
  _data.recvState = ''
  _data.recvCommand = ''
}

//发送请求命令
function sendReq(sendCommand, sendContent) {
  cleanRecv()
  return new Promise((resolve, reject) => {
    _data.sendCommand = sendCommand
    if (sendContent == null)
      _data.sendContent = ''
    else
      _data.sendContent = sendContent
    doSendContent(_data.sendCommand + ':' + _data.sendContent + '\n')
    let count = 0
    //定时执行
    let interval = setInterval(function () {
      count++
      //  console.log('hello _data.recvState:' + _data.recvState)
      if (count >= 10) {
        clearInterval(interval)
        reject('超时无应答')
      }
      if (_data.recvState == 'OK') {
        clearInterval(interval)//停止定时执行
        resolve(_data.recvContent)
      } else if (_data.recvState == 'NG') {
        clearInterval(interval)//停止定时执行
        reject(_data.recvContent)
      }
    }, 500)
  })
}
class Bt3Api {
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
        }).catch((res) => {
          console.log('蓝牙创建失败' + JSON.stringify(res))
          reject('蓝牙创建失败')
        })
    })
  }

  //测试，不用login
  static test() {
    _data.sendCommand = 'TEST'
    _data.sendContent = 'AAAAABBBBBCCCCCDDDDDEEEEEFFFFFGGGGGHHHHHIIIII'
    return sendReq()
  }

  static login() { return sendReq(_cmd.login) }

  static getControlSerial(serial) { return sendReq(_cmd.getSerial, serial) }
  static setControlSerial(serial) { return sendReq(_cmd.setSerial, serial) }
  static delControlSerial(serial) { return sendReq(_cmd.delSerial, serial) }

  static setEstateNum(num) { return sendReq(_cmd.setEstateNum, num) }
  static getEstateNum() { return sendReq(_cmd.getEstateNum) }

  static setWifissid(wifissid) { return sendReq(_cmd.setWifissid, wifissid) }
  static getWifissid() { return sendReq(_cmd.getWifissid) }

  static setWifipsw(wifipsw) { return sendReq(_cmd.setWifipsw, wifipsw) }
  static getWifipsw() { return sendReq(_cmd.getWifipsw) }

  static setVol(vol) { return sendReq(_cmd.setVol, vol) }
  static getVol() { return sendReq(_cmd.getVol) }

  static setRit(rit) { return sendReq(_cmd.setRit, rit) }
  static getRit() { return sendReq(_cmd.getRit) }

  static setCtc(rit) { return sendReq(_cmd.setCtc, rit) }
  static getCtc() { return sendReq(_cmd.getCtc) }

  static setNwy(nwy) { return sendReq(_cmd.setNwy, nwy) }
  static getNwy() { return sendReq(_cmd.getNwy) }

  static setDhc(dhcp) { return sendReq(_cmd.setDhcp, dhcp) }
  static getDhc() { return sendReq(_cmd.getDhcp) }

  static setNip(nip) { return sendReq(_cmd.setNip, nip) }
  static getNip() { return sendReq(_cmd.getNip) }

  static setNgw(ngw) { return sendReq(_cmd.setNgw, ngw) }
  static getNgw() { return sendReq(_cmd.getNgw) }

  static setNms(nms) { return sendReq(_cmd.setNms, nms) }
  static getNms() { return sendReq(_cmd.getNms) }

  static setDns(dns) { return sendReq(_cmd.setDns, dns) }
  static getDns() { return sendReq(_cmd.getDns) }

  static setEnd() { return sendReq(_cmd.setEnd) }

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
                    console.log('localName:' + name);
                    if (name == null) {
                      continue
                    }
                    let per = name.substr(0, 2);
                    //  console.log("per:" + per);
                    if (per != "nk") {
                      continue;
                    }
                    let shortMac = name.substr(name.length - 6, 6);
                    console.log("shortMac:" + shortMac);
                    var findDeviceId = res.devices[i].deviceId;
                    //    console.log(i + " (res.devices[i].deviceId)" + findDeviceId);
                    var findRSSI = res.devices[i].RSSI;
                    for (var j = 0; j < _data.subDeviceList.length; j++) {
                      let TargetShortMac = _data.subDeviceList[j].serial.substr(_data.subDeviceList[j].serial.length - 6, 6)
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
        }).catch((res) => {
          //   console.log('打开蓝牙适配器失败' + JSON.stringify(res))
          reject("打开蓝牙适配器失败,请启动蓝牙")
        })
    })
  }


  static startDiscoveryBySufBtName(subDeviceList, callback) {
    _data.startDiscoveryCallback = callback
    _data.subDeviceList = subDeviceList
    return new Promise((resolve, reject) => {
      WxApi.openBluetoothAdapter().then((res) => {
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
                  if (name == null) { continue }
                  let per = name.substr(0, 2);
                  if (per != "nk" && per != "Nk") { continue; }
                  //  let shortMac = name.substr(name.length - 6, 6);
                  //  console.log("shortMac:" + shortMac);
                  var findDeviceId = res.devices[i].deviceId;
                  var findRSSI = res.devices[i].RSSI;
                  for (var j = 0; j < _data.subDeviceList.length; j++) {
                    let shortMac = name.substr(name.length - _data.subDeviceList[j].sufBtName.length, _data.subDeviceList[j].sufBtName.length);
                    //  console.log("shortMac:" + shortMac);
                    let TargetShortMac = _data.subDeviceList[j].sufBtName
                    //  console.log("TargetShortMac:" + TargetShortMac);
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

}
export default Bt3Api
