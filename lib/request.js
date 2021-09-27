const url = require('url')

const request = {
  get method(){
    return this.req.method
  },

  get herder(){
    return this.req.herders
  },

  get url(){
    return this.req.url
  },

  get path(){
    return url.parse(this.req.url).pathname
  },

  get query(){
    return url.parse(this.req.url, true).query
  },
}

module.exports = request