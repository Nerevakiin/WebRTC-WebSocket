const chatInput = document.getElementById('chat-input')
const sendMsgBtn = document.getElementById('msg-btn')
const messagesDiv = document.getElementById('chatroom-inner')

const callBtn = document.getElementById('call-btn')
const hangUpBtn = document.getElementById('hang-btn')
const videoDiv = document.getElementById('videocall-inner')

const socket = new WebSocket('ws://localhost:8000')



socket.addEventListener('open', (event) => {
    console.log('WEBSOCKET CONNECTION ESTABLISHED')
})

socket.addEventListener('message', (event) => {

    const msg = document.createElement('div')
    msg.textContent = event.data

    messagesDiv.appendChild(msg)
    messagesDiv.scrollTop = messagesDiv.scrollHeight
})

sendMsgBtn.addEventListener('click', () => {
    if (chatInput.value.trim() === '') return 

    socket.send(chatInput.value)
    chatInput.value = ''
})
