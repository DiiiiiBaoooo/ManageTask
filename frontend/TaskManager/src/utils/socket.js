// src/utils/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:8000"); // Địa chỉ backend

export default socket;
