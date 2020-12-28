import Bt1Api from '../../api/Bt1Api'
import ApiState from '../../api/ApiState'
import WxApi from '../../api/WxApi'
import DeviceAccessApi from '../../api/DeviceAccessApi'
Page({
  data: {
    infoText: ""
  },
  onLoad: function () {
    var that = this
    that.startOpenDoor()

  },

  onHide: function () {
    var that = this
    that.closeBLEConnection()
  },
  startOpenDoor: function () {
    var that = this
    if (ApiState.bleDevice == null) {
      that.setData({
        infoText: that.data.infoText + '设备为空\n'
      });
      return
    }
    console.log(' startOpenDoor ApiState.bleDevice-----------' + ApiState.bleDevice.eid + ',' + ApiState.bleDevice.deviceId + ',' + ApiState.bleDevice.installPathFull)
    that.setData({
      infoText: that.data.infoText + '连接设备...\n'
    });
    Bt1Api.openBle(ApiState.bleDevice.deviceId).then((res) => {
      console.log('连接设备成功')
      that.setData({
        infoText: that.data.infoText + '连接设备成功\n'
      });
      Bt1Api.hello().then((randum) => {
        //  console.log('发HELLO后收到随机码：' + randum)
        that.setData({
          infoText: that.data.infoText + '正在开门......\n'
        });
        //获取开门密文
        console.log('getAccessCiphertext id' + ApiState.bleDevice.eid)
        DeviceAccessApi.getAccessCiphertext(ApiState.bleDevice.eid, randum).then(
          (accessciphertext) => {
            // console.log("开门密文： " + accessciphertext);
            Bt1Api.openDoor(accessciphertext).then((res) => {
              that.setData({
                infoText: that.data.infoText + res + '\n'
              });
              that.cancel()
            }).catch((res) => {
              that.setData({
                infoText: that.data.infoText + res + '\n'
              });
            })
          },
          (res) => {
            that.setData({
              infoText: that.data.infoText + res + '\n'
            });
          }
        )
      }, (res) => {
        that.setData({
          infoText: that.data.infoText + res + '\n'
        });
      })
    }, (res) => {
      that.closeBLEConnection()
      that.setData({
        infoText: that.data.infoText + res + '\n'
      });
    })
  },
  cancel: function () {
    var that = this
    that.closeBLEConnection()
    WxApi.navigateBack({
      delta: 1
    })
  },

  closeBLEConnection: function () {
    var that = this
    WxApi.closeBLEConnection(ApiState.bleDevice.deviceId
    ).then((res) => {
      console.log(' 关闭蓝牙链接成功')
    },
      (res) => {
        console.log('关闭蓝牙链接失败' + JSON.stringify(res))
      })
  }
})
