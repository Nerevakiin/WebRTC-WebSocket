const chatInput = document.getElementById('chat-input')
const sendMsgBtn = document.getElementById('msg-btn')
const messagesDiv = document.getElementById('chatroom-inner')

const callBtn = document.getElementById('call-btn')
const hangUpBtn = document.getElementById('hang-btn')
const videoDiv = document.getElementById('videocall-inner')

// const pc = new RTCPeerConnection({
//     iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
// });

const socket = new WebSocket('http://192.168.100.5:8000/')



socket.addEventListener('open', (event) => {
    console.log('WEBSOCKET CONNECTION ESTABLISHED')
})

socket.addEventListener('message', (event) => {

    const msg = document.createElement('div')
    msg.textContent = event.data

    messagesDiv.appendChild(msg)
    messagesDiv.scrollTop = messagesDiv.scrollHeight
})

sendMsgBtn.addEventListener('click', (e) => {
    e.preventDefault()
    if (chatInput.value.trim() === '') return 

    socket.send(chatInput.value)
    chatInput.value = ''
})




// ============ WebRTC ===============

async function startCamera() {
    try {
        const constraints = { 'video': true, 'audio': true }

        // wait for the user to give permission
        const localStream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log('got mediaStream: ', localStream)

        // find the video element
        const localVideoElement = document.getElementById('localVideo')

        // set the stream as the source of the video
        localVideoElement.srcObject = localStream
        

    } catch (err) {
        console.error('error accesing media devices: ', err)
    }
}


startCamera()



