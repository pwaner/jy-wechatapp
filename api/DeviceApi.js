import RestApi from './RestApi'

let _data = {
}
class DeviceApi {

  static installPathFull(device, ctSerial) {
    //debugger
    let installPath = device.installPath || '',
      installPostScript = device.installPostScript || ''
    if (installPostScript != '')
      installPostScript = '(' + installPostScript + ')'
    if (ctSerial) {
      //   let installPostScript1 = device.installPostScript || ''
      return installPath + installPostScript + '-' + device.serial
    }
    return installPath + installPostScript
  }
  static fillDevice(devices, ctSerial) {
    //debugger
    for (let i = 0; i < devices.length; i++) {
      let installPathFull = DeviceApi.installPathFull(devices[i], ctSerial)
      devices[i].installPathFull = installPathFull
    }
    return devices
  }


  static findDevicesBySerial(devices, serial) {
    //debugger
    for (let i = 0; i < devices.length; i++) {
      if (devices[i].serial == serial)
        return i
    }
    return -1
  }

}
export default DeviceApi
