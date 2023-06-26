const http = require('http')
const express = require('express')
const socketIO = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

// 패턴과 해당 패턴에 대한 응답을 정의합니다.
const patterns = [
  {
    pattern: '안녕',
    response: '안녕하세요! 반갑습니다!'
  },
  {
    pattern: '날씨',
    response: '오늘은 맑은 날씨입니다.'
  },
  {
    pattern: '이름',
    response: '제 이름은 챗봇입니다.'
  },
  {
    pattern: '위치',
    response: '지금 위치는 부산 서면입니다.'
  },
  {
    pattern: '음식',
    response: '돈가스가 땡기네요...'
  }
]

// 채팅 화면을 제공하는 경로와 라우트를 설정합니다.
app.get('/chat', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

io.on('connection', (socket) => {
  console.log('새로운 사용자가 연결되었습니다.')

  // 클라이언트로부터의 메시지 이벤트를 처리합니다.
  socket.on('message', (message) => {
    console.log('받은 메시지:', message)

    // 챗봇 로직: 패턴 매칭을 사용하여 응답을 생성합니다.
    let response = '챗봇: 죄송해요, 이해하지 못했습니다.'
    for (const pattern of patterns) {
      if (message.includes(pattern.pattern)) {
        response = '챗봇: ' + pattern.response
        break
      }
    }

    // 클라이언트에게 응답을 전송합니다.
    socket.emit('chat message', response)
  })

  // 연결이 끊어졌을 때 처리합니다.
  socket.on('disconnect', () => {
    console.log('사용자가 연결을 종료했습니다.')
  })
})

// 서버를 시작합니다.
const port = 3000
server.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`)
})
