class PublishtionModel {
  
  subscribers = {
    any: []
  }

  // 添加订阅者 订阅者 = 注册方法
  on(type,fn) {
    type = type || 'any'
    if (typeof this.subscribers[type] === 'undefined') {
      this.subscribers[type] = []
    }
    this.subscribers[type].push(fn)
  }

  // 移除订阅者
  remove() {
    // 传入参数 移除的指令 移除的用户 对应的订阅消息
    this.visitSubscribers('unsubscribe', fn, type)
  }

  // 发布消息 
  publish(publication, type) {
    // 传入参数 发布消息的指令 发布的内容 发布到具体哪个类目
    this.visitSubscribers('publish', publication, type)
  }

  // 访问订阅库 参数 传入的动作 arg是用户或者消息 type消息的类型
  visitSubscribers(action, arg, type) {
    // 需要访问的具体的消息类别 若没有 则为默认消息
    var pubtype = type || 'any',
      // 获取订阅此消息的所有用户的列表
      subscribers = this.subscribers[pubtype],
      i,
      // 获取用户数量
      max = subscribers ? subscribers.length : 0
    for (i = 0; i < max; i++) {
      // 如果操作是 发布消息
      if (action == 'publish') {
        // 发布的内容 
        subscribers[i](arg)
      } else {
        // 如果操作不是发布 则进行删除订阅该消息对应的某个用户 就是传入的方法
        if (subscribers[i] === arg) {
          // 删除这个 1个
          subscribers.splice(i, 1)
        }
      }
    }
  }

}

export {
  PublishtionModel
}