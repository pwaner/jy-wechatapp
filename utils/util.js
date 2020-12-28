
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
};


/*
const getText=(buffer, offSet)=> {
  var newBuffer = buffer.slice(0, offSet);
  var hex = arrayBufferToHexString(newBuffer);
  var text = hexCharCodeToStr(hex);
  console.log("/ChangeTest:" + text);
  return text;
};
*/


// 流转16进制
const arrayBufferToHexString = buffer => {
  let bufferType = Object.prototype.toString.call(buffer)
  if (buffer != '[object ArrayBuffer]') {
    return
  }
  let dataView = new DataView(buffer)

  var hexStr = '';
  for (var i = 0; i < dataView.byteLength; i++) {
    var str = dataView.getUint8(i);
    var hex = (str & 0xff).toString(16);
    hex = (hex.length === 1) ? '0' + hex : hex;
    hexStr += hex;
  }

  return hexStr.toUpperCase();
};



//16进制转字符串

const hexCharCodeToStr = hexCharCodeStr => {
  var trimedStr = hexCharCodeStr.trim();
  var rawStr =
    trimedStr.substr(0, 2).toLowerCase() === "0x"
      ?
      trimedStr.substr(2)
      :
      trimedStr;
  var len = rawStr.length;
  if (len % 2 !== 0) {
    alert("Illegal Format ASCII Code!");
    return "";
  }
  var curCharCode;
  var resultStr = [];
  for (var i = 0; i < len; i = i + 2) {
    curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
    resultStr.push(String.fromCharCode(curCharCode));
  }
  return resultStr.join("");
};

//字符串转16进制

const strToHexCharCode = str => {
  if (str === "")
    return "";
  var hexCharCode = [];
  hexCharCode.push("0x");
  for (var i = 0; i < str.length; i++) {
    hexCharCode.push((str.charCodeAt(i)).toString(16));
  }
  return hexCharCode.join("");
};


const mainUrl = () => {
  //  return "https://test.zayutech.com/"
  return "http://dev.nkdr-cssp.com"
};

var reLogin = () => {
  wx.showToast({
    title: '正在重新登录',
    icon: 'loading',
    duration: 1000
  })
  setTimeout(function () {
    wx.reLaunch({
      url: '../myindex/myindex'
    })
  }, 1000);

}



var getPrefer = (preferStr) => {
  console.log("preferStr", preferStr);
  var myFastOpen = true;
  if (preferStr != null && preferStr != "") {
    var myPrefer = JSON.parse(preferStr)
    console.log("myPrefer1", myPrefer);
    console.log(" myPrefer.fastOpen", myPrefer.fastOpen);
    if (myPrefer.fastOpen != null) {
      myFastOpen = myPrefer.fastOpen
    }
  }
  var prefer = {
    fastOpen: myFastOpen
  }
  console.log("prefer", prefer);
  return prefer;
}

module.exports = {
  formatTime: formatTime,
  arrayBufferToHexString: arrayBufferToHexString,
  hexCharCodeToStr: hexCharCodeToStr,
  strToHexCharCode: strToHexCharCode,
  mainUrl: mainUrl,
  reLogin: reLogin,
  getPrefer: getPrefer,

}

