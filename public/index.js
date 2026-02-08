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
let iceCandidateQueue = [] // This will hold candidates until the description is set


const socket = new WebSocket('wss://192.168.100.3:8000/')

const configuration = {
    iceServers: [{ urls: "stun:stun1.l.google.com:5349" }]
}


// WEBSOCKET ROUTING 

socket.addEventListener('open', (event) => {
    console.log('WEBSOCKET CONNECTION ESTABLISHED')
})

socket.addEventListener('message', async (event) => {

     // Check if data is JSON (signals) or plain text (chat)
    let data = JSON.parse(event.data)

    if (data.type === 'chat') {

        displayMessage(data.user, data.text)

    } else if (data.type === 'system') {
        displayMessage('SYSTEM', data.text)
    }



    // WEB RTC SIGNALING LOGIC
    if (data.offer) {

        console.log('received offer, creating answer')
        await handleOffer(data.offer)

    } else if (data.answer) {

        console.log('received answer...')
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
        processQueuedCandidates()

    } else if (data.candidate) {
        console.log('received ICE candidate...')

        if (peerConnection && peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
        } else {
            console.log('queueing candidate: remoteDescription not set yet')
            iceCandidateQueue.push(data.candidate)
        }
    }

    if (data.type === 'hangup') {
        console.log('the other person hung up')
        hangUp()
    }

})

async function processQueuedCandidates() {
    console.log(`Processing ${iceCandidateQueue.length} queued candidates.`)
    for (const candidate of iceCandidateQueue) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    }
    iceCandidateQueue = []
}



// CHAT logic

sendMsgBtn.addEventListener('click', (e) => {
    e.preventDefault()
    const text = chatInput.value.trim()
    if (text === '') return

    // show to my self imediatelly
    displayMessage('Me: ', text)

    // send it to others
    const payload = {
        type: 'chat',
        user: 'Stranger: ',
        text: text 
    }


    socket.send(JSON.stringify(payload))
    chatInput.value = ''
})

function displayMessage(user, text) {
    const msg = document.createElement('div');
    msg.innerHTML = `<strong>${user}:</strong> ${text}`;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}




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

// this runs when I click the hang up button
hangUpBtn.addEventListener('click', (e) => {
    e.preventDefault()

    // 1. run the cleanup locally
    hangUp()

    // tell the other person via the websocket
    socket.send(JSON.stringify({ type: 'hangup' }))

})

function hangUp() {
    console.log('hanging up the call...')

    if (peerConnection) {
        peerConnection.close()
        peerConnection = null 
    }

    remoteVideo.srcObject = null 

    iceCandidateQueue = []

}


// this runs when the OTHER person receives your offer
async function handleOffer(offer) {
    createPeerConnection()
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))

    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    console.log('sending answer...')
    
    socket.send(JSON.stringify({ answer: answer }))

    processQueuedCandidates()

}


