module.exports = function(io) {
  return {
    log: function(message) {
      if (io)
        io.emit('log', message)
      console.log(message)
    }
  }
}
