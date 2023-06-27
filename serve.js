// 필요한 모듈 불러오기
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// 정적 파일 제공
app.use(express.static(__dirname + "/"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// 로그인한 사용자 저장을 위한 객체
const users = {};

// 대화 기록 저장을 위한 배열
const conversationHistory = [];

// 채팅방 연결
io.on("connection", (socket) => {
  console.log("A user connected");

  // 로그인 이벤트 처리
  socket.on("login", (username) => {
    // 익명 사용자인지 확인
    const isAnonymous = username === "익명";

    // 사용자 정보 저장
    users[socket.id] = {
      username: isAnonymous ? `익명${socket.id.substr(0, 4)}` : username,
      isAnonymous: isAnonymous,
    };

    // 입장 메시지를 전체에게 전송
    const message = `${users[socket.id].username}님이 입장하셨습니다.`;
    io.emit("chat message", { message: message, from: "서버" });
  });

  // 채팅 메시지 이벤트 처리
  socket.on("chat message", (msg) => {
    const sender = users[socket.id].username;
    let message = msg.message;
    // 전체 채팅 메시지 전송
    io.emit("chat message", { message: message, from: sender });
    // 귓속말 처리
    if (msg.to) {
      const receiverId = Object.keys(users).find(
        (id) => users[id].username === msg.to
      );
      if (receiverId) {
        io.to(receiverId).emit("chat message", {
          message: `[귓속말] ${sender}: ${message}`,
          from: "귓속말",
        });
        message = `[귓속말] ${message}`;
      } else {
        message = `[귓속말 실패] 대화 상대를 찾을 수 없습니다.`;
      }
    } else {
      message = `${sender}: ${message}`;

      // 챗봇 응답 처리
      if (!users[socket.id].isAnonymous) {
        const triggerPhrases = [
          "!명령어",
          "안녕",
          "반가워",
          "좋은하루",
          "날씨",
          "잘가",
        ];
        const botResponses = [
          "사용가능한 명령어로는 '안녕, 반가워, 좋은하루, 날씨, 잘가'가 있습니다.",
          "안녕하세요!",
          "만나서 반가워요!",
          "네, 좋은 하루 되세요!",
          "오늘은 맑네요. 축구 한판 어떠신가요??!!",
          "안녕히 가세요!",
        ];

        // 사용자가 보낸 메시지가 챗봇의 트리거 문구와 일치하는지 확인
        const userMessage = msg.message;
        const triggerIndex = triggerPhrases.indexOf(userMessage);

        if (triggerIndex !== -1) {
          const botResponse = botResponses[triggerIndex];
          io.emit("chat message", {
            message: ` ${botResponse}`,
            from: "Chatbot",
          });
        }
      }
    }
  });

  // 연결 해제 이벤트 처리
  socket.on("disconnect", () => {
    console.log("A user disconnected");
    // 사용자가 연결을 해제하면 사용자 정보 삭제 및 퇴장 메시지 전송
    const username = users[socket.id].username;
    delete users[socket.id];
    const message = `${username}님이 퇴장하셨습니다.`;
    io.emit("chat message", { message: message, from: "서버" });
  });
});

// 서버 실행
http.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
