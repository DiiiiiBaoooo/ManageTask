// src/utils/socket.js
import { io } from "socket.io-client";

const socket = io("https://manage-task-serve.vercel.app"); // Địa chỉ backend

export default socket;
