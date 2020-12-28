import RestApi from './RestApi'

let _data = {
}
class EstateApi {

  static getFullName(estate) {
    //debugger
    // let path = estate.path || '',
    let name = estate.name || '',
      num = estate.num || '',
      postScript = estate.postScript || ''
    if (postScript != '')
      postScript = '(' + postScript + ')'
    if (num != '')
      num = '(' + num + ')'
    return name + postScript + num
  }
  static fillEstate(estates) {
    //debugger
    for (let i = 0; i < estates.length; i++) {
      let fullName = EstateApi.getFullName(estates[i])
      estates[i].fullName = fullName
    }
    return estates
  }

}
export default EstateApi
