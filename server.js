import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const port = 3000;
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  let onlineUsers = 0;

  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    onlineUsers++;

    io.emit("online_count", onlineUsers);

    socket.on("join_room", (room) => {
      socket.join(room);
    });

    socket.on("send_message", (data) => {
      io.to(data.room).emit("receive_message", data);
    });

    socket.on("typing", (data) => {
      socket.to(data.room).emit("user_typing", data);
    });

    socket.on("stop_typing", (room) => {
      socket.to(room).emit("user_stop_typing");
    });

    socket.on("disconnect", () => {
      onlineUsers--;

      io.emit("online_count", onlineUsers);

      console.log("Disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`Server started http://localhost:${port}`);
  });
});