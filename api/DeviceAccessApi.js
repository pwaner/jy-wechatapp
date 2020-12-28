import RestApi from './RestApi'
function getDevicesBySubject() {
  return new Promise(function (resolve, reject) {
    RestApi.get(_data.restUrl).then(
      (res) => {
        RestApi.cookie = res.cookies
        if (res.data && res.data.success) {
          let subjectDevices = res.data.rows
          _data.devices = subjectDevices
          resolve(subjectDevices) 
        } else reject(res.data.message)
      },
      (res) => {
        reject(res.errMsg)
      }
    )
  })
}

function getDeviceById(eid) {
  return new Promise(function (resolve, reject) {
    RestApi.get(_data.restUrl + '/' + eid).then(
      (res) => {
        RestApi.cookie = res.cookies
        if (res.data && res.data.success) {
          let subjectDevice = res.data.rows
          resolve(subjectDevice)
        } else reject(res.data.message)
      },
      (res) => {
        reject(res.errMsg)
      }
    )
  })
}


let _data = {
  //getDevicesBySubject返回的设备列表
  devices: null,
  restUrl: '/devices/accesses/'
}
class DeviceAccessApi {
  static getDevices(force) {
    return new Promise(function (resolve, reject) {
      if (force != true && _data.devices) {
        resolve(_data.devices)
        return
      }
      getDevicesBySubject().then(
        (subjectDevices) => {
          _data.devices = subjectDevices
          resolve(subjectDevices)
        },
        (message) => {
          reject(message)
        }
      )
    })
  }

  static getAccessCiphertext(eid, randnum) {
    //  console.log('getAccessCiphertext')
    return new Promise(function (resolve, reject) {
      let para = {
        randnum: randnum
      }
      RestApi.get(_data.restUrl + eid + '/accessciphertext', { data: para }).then(
        (res) => {
          RestApi.cookie = res.cookies
          if (res.data && res.data.success) {
            //   console.log("accessciphertext" + JSON.stringify(res));
            resolve(res.data.rows[0])
          } else reject(res.data.message)
        },
        (res) => {
          reject('网络访问错误')
        }
      )
    })
  }
  static getVisitorPSW(eid) {
    //console.log('getVisitorPSW')
    return new Promise(function (resolve, reject) {
      RestApi.get(_data.restUrl + eid + '/visitorpsw').then(
        (res) => {
          RestApi.cookie = res.cookies
          if (res.data && res.data.success) {
            // console.log("临时开门密码" + JSON.stringify(res));
            resolve(res.data.rows[0])
          } else reject(res.data.message)
        },
        (res) => {
          reject('网络访问错误')
        }
      )
    })
  }
  static getDevice(eid) {
    return getDeviceById(eid)
  }

  static getCorrelateHouses(eid, num) {
    return new Promise(function (resolve, reject) {
      let params = null
      if (num != null) {
        params = {
          filter: [{ "property": "coeNum", "operator": "like", "value": num }]
        }
      }


      RestApi.get(_data.restUrl + eid + '/houses', { data: params }).then(
        (res) => {
          RestApi.cookie = res.cookies
          if (res.data && res.data.success) {
            let houses = res.data.rows
            resolve(houses)
          } else reject(res.data.message)
        },
        (res) => {
          reject(res.errMsg)
        }
      )
    })
  }
}
export default DeviceAccessApi
