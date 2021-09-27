const http = require('http')
const { Stream } = require('stream')
const context = require('./context')
const request = require('./request')
const response = require('./response')


class Application{
  constructor(){
    this.middleware = [] //保存用户添加的中间件函数

    this.context = Object.create(context) // 为了防止污染全局的context，request，response使用Object.create拷贝一份
    this.request = Object.create(request)
    this.response = Object.create(response)
  }

  listen(...args){
    const server = http.createServer(this.callback())

    server.listen(...args)
  }

  use(fun){
    this.middleware.push(fun)
  }

  // 异步递归遍历调用中间件处理函数
  compoose(middleware){
    return function (context) {
      const dispatch = index =>{
        if(index >= middleware.length) return Promise.resolve()
        const fn = middleware[index]
        return Promise.resolve(
          // TODO: 上下文对象
          fn(context, ()=>{ dispatch(index+ 1) }) // 循环调用变成异步递归调用.这是 next 函数
        )
      }
      // 返回第一个中间件处理函数
      return dispatch(0)
    }
  }

  // 构造上下文对象
  createContext(req, res){
    // 一个实例会处理多个请求，而不同的请求应该拥有不同的上下文对象，为了避免请求期间的数据交叉污染，所以这里又对这个数据做了一份儿新的拷贝
    const context = Object.create(this.context)
    const request = (context.request = Object.create(this.request))
    const response = (context.response = Object.create(this.response))

    context.app = request.app = response.app = this
    context.req = request.req = response.req = req // 原生的请求对象
    context.res = request.res = response.res = res // 原生的响应对象
    request.ctx = response.ctx = context // 在 Request 和 Response 中也可以拿到 context 上下文对象
    request.response = response // Request 中也可以拿到 Response
    response.request = request // Response 中也可以拿到 Request
    context.originalUrl = request.originalUrl = req.url // 没有经过任何处理的请求路径
    context.state = {} // 初始化 state 数据对象，用于给模板视图提供数据

    return context
  }

  callback(){
    const fnMidddleware = this.compoose(this.middleware)
    const handleRequest = ( req, res ) =>{
      // 每个请求都会创建一个独立的 context 上下文对象，他们之间不会相互污染
      const context = this.createContext(req, res)
      fnMidddleware(context).then(()=>{
        respond(context)
      }).catch(err=>{
        res.end(err.massage)
        console.log('err', err);
      })
    }

    return handleRequest
  }
}

function respond (ctx) {
  const body = ctx.body
  const res = ctx.res

  if (body === null) {
    res.statusCode = 204
    return res.end()
  }

  if (typeof body === 'string') return res.end(body)
  if (Buffer.isBuffer(body)) return res.end(body)
  if (body instanceof Stream) return body.pipe(ctx.res)
  if (typeof body === 'number') return res.end(body + '')
  if (typeof body === 'object') {
    const jsonStr = JSON.stringify(body)
    return res.end(jsonStr)
  }
}

module.exports = Application