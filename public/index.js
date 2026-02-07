const chatInput = document.getElementById('chat-input')
const sendMsgBtn = document.getElementById('msg-btn')
const messagesDiv = document.getElementById('chatroom-inner')

const callBtn = document.getElementById('call-btn')
const hangUpBtn = document.getElementById('hang-btn')
const videoDiv = document.getElementById('videocall-inner')

const socket = new WebSocket('ws://localhost:8000')




