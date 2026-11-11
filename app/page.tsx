"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";

interface Message {
  user: string;
  text: string;
  room: string;
  time: string;
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("general");
  const [joined, setJoined] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [typingUser, setTypingUser] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);

  const joinRoom = () => {
    if (!username.trim()) return;

    socket.emit("join_room", room);

    setJoined(true);
  };

  useEffect(() => {
    socket.on("receive_message", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("user_typing", (user: string) => {
      setTypingUser(user);

      setTimeout(() => {
        setTypingUser("");
      }, 2000);
    });

    socket.on("user_stop_typing", () => {
      setTypingUser("");
    });

    socket.on("online_count", (count: number) => {
      setOnlineCount(count);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("online_count");
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;

    const data: Message = {
      user: username,
      text: message,
      room,
      time: new Date().toLocaleTimeString(),
    };

    socket.emit("send_message", data);

    setMessage("");
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (value.trim()) {
      socket.emit("typing", username);
    } else {
      socket.emit("stop_typing", room);
    }
  };

  if (!joined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-xl shadow-lg w-[400px]">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Socket Chat
          </h1>

          <input
            placeholder="Username"
            className="border w-full p-3 rounded mb-3"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            placeholder="Room"
            className="border w-full p-3 rounded mb-4"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />

          <button
            onClick={joinRoom}
            className="w-full bg-blue-600 text-white p-3 rounded"
          >
            Join Chat
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex justify-center py-10">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg flex flex-col">
        <div className="bg-blue-600 text-white p-4 rounded-t-xl">
          <div className="flex justify-between">
            <div>
              <h2 className="font-bold text-xl">
                Room: {room}
              </h2>
              <p>Welcome, {username}</p>
            </div>

            <div>
              Online Users: {onlineCount}
            </div>
          </div>
        </div>

        <div className="h-[500px] overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.user === username
                  ? "bg-blue-500 text-black self-end"
                  : "bg-gray-200 text-black self-start"
              }`}
            >
              <div className="font-bold">
                {msg.user}
              </div>

              <div>{msg.text}</div>

              <div className="text-xs opacity-70">
                {msg.time}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 text-sm text-red-500 h-6">
          {typingUser && `${typingUser} is typing...`}
        </div>

        <div className="p-4 flex gap-2">
          <input
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border p-3 rounded text-black"
          />

          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-6 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}