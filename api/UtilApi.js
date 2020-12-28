class UtilApi {
  ////16进制转字符串
  static hexCharCodeToStr(str) {
    let trimedStr = str.trim();
    let rawStr =
      trimedStr.substr(0, 2).toLowerCase() === "0x"
        ?
        trimedStr.substr(2)
        :
        trimedStr;
    let len = rawStr.length;
    if (len % 2 !== 0) {
      alert("Illegal Format ASCII Code!");
      return "";
    }
    let curCharCode;
    let resultStr = [];
    for (let i = 0; i < len; i = i + 2) {
      curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
      resultStr.push(String.fromCharCode(curCharCode));
    }
    return resultStr.join("");
  }


  // 流转16进制
  static arrayBufferToHexString(buffer) {
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
}
export default UtilApi
