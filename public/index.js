const chatInput = document.getElementById('chat-input')
const sendMsgBtn = document.getElementById('msg-btn')
const messagesDiv = document.getElementById('chatroom-inner')

const callBtn = document.getElementById('call-btn')
const hangUpBtn = document.getElementById('hang-btn')
const videoDiv = document.getElementById('videocall-inner')
const localVideo = document.getElementById('localVideo')
const remoteVideo = document.getElementById('remoteVideo')


// global variables:
let localStream = null
let peerConnection = null


const socket = new WebSocket('wss://192.168.100.3:8000/')

const configuration = {
    iceServers: [{ urls: "stun:stun1.l.google.com:5349" }]
}


// WEBSOCKET ROUTING 

socket.addEventListener('open', (event) => {
    console.log('WEBSOCKET CONNECTION ESTABLISHED')
})

socket.addEventListener('message', async (event) => {

    const data = JSON.parse(event.data)

    // if its a chat message, display it
    if (data.type === 'chat') {

        const msg = document.createElement('div')
        msg.textContent = event.data
        messagesDiv.appendChild(msg)
        messagesDiv.scrollTop = messagesDiv.scrollHeight

    }

    // WEB RTC SIGNALING LOGIC
    if (data.offer) {
        console.log('received offer, creating answer')
        await handleOffer(data.offer)

    } else if (data.answer) {
        console.log('received answer...')
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
    } else if (data.candidate) {
        console.log('received ICE candidate...')
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
        } catch (err) {
            console.error('Error adding received ice candidate: ', err)
        }
    }

})



// CHAT logic
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
        localStream = await navigator.mediaDevices.getUserMedia(constraints)
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


// PEER CONNECTION SETUP 
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration)

    // when the broswer finds a connection path (ice candidate), send it to the other person
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.send(JSON.stringify({ candidate: event.candidate }))
        }
    }

    // when the remote stream arrives, show it in the remote video tag
    peerConnection.ontrack = (event) => {
        console.log('got remote track: ', event.streams[0])
        remoteVideo.srcObject = event.streams[0]
    }

    // add my camera/mic tracks to the connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
    })
}

// THE HANDSHAKE!

// this runs when I click the call button
callBtn.addEventListener('click', async (e) => {

    e.preventDefault()
    createPeerConnection()

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    console.log('sending offer...')
    socket.send(JSON.stringify({ offer: offer }))

})


// this runs when the OTHER person receives your offer
async function handleOffer(offer) {
    createPeerConnection()
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))

    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    console.log('sending answer...')
    await peerConnection.setLocalDescription(answer)

    console.log('sending answer...')
    socket.send(JSON.stringify({ answer: answer }))


}



