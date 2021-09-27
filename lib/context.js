const context = {
  // 动态赋值的第一种方法
  // get method(){
  //   return this.request.method
  // },
  
  // get url(){
  //   return this.request.url
  // }
}

// 动态赋值的第二种方法，使用defineProperty的get
defineProperty('request', 'method')
defineProperty('request', 'url')
defineProperty('response', 'body')

function defineProperty(target, name) {
  Object.defineProperty(context, name, {
    get(){
      return this[target][name]
    },
    set(value){
      this[target][name] = value
    }
  })
}

// 动态赋值的第三种方法.使用原生的方法。koa内部是使用的这个方法
// defineProperty('request', 'method')
// defineProperty('request', 'url')

// function defineProperty(target, name) {
//   context.__defineGetter__(name, function () {
//     return this[target][name]
//   })
// }


module.exports = context