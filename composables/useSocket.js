import { io } from 'socket.io-client'

let socket = null

export const useSocket = () => {
  const initSocket = () => {
    if (!socket) {
      socket = io('/', {
        transports: ['websocket', 'polling']
      })
    }
    return socket
  }

  const getSocket = () => {
    return socket || initSocket()
  }

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }

  return {
    initSocket,
    getSocket,
    disconnectSocket
  }
}
