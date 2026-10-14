import { io } from 'socket.io-client'

let socket = null
let connecting = null

export const useSocket = () => {
  const initSocket = () => {
    if (socket) {
      return Promise.resolve(socket)
    }

    if (!connecting) {
      connecting = $fetch('/api/socket')
        .then(() => new Promise((resolve, reject) => {
          const client = io({
            path: '/socket.io',
            transports: ['websocket', 'polling']
          })

          const fail = (error) => {
            client.close()
            reject(error)
          }

          client.once('connect', () => {
            client.off('connect_error', fail)
            socket = client
            resolve(client)
          })
          client.once('connect_error', fail)
        }))
        .catch((error) => {
          connecting = null
          socket = null
          throw error
        })
    }

    return connecting
  }

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
    connecting = null
  }

  return {
    initSocket,
    disconnectSocket
  }
}
