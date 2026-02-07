import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'

const app = express()
const PORT = 8000



app.use(express.json())


app.use(express.static('public'))


const server = createServer(app)

const wss = new WebSocketServer({ server }) // pass the HTTP server here

// ======= WEB SOCKET ===========

wss.on('connection', (ws, request) => {


    console.log('NEW WEBSOCKET CONNECTION')

    
    ws.on('message', (data) => {
        
        console.log('RECEIVED: ', data.toString())

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data.toString())
            }
        })
    })



    ws.send(JSON.stringify({
        type: 'system',
        text: 'wra gia peoi'
    }))



})


app.use((req, res) => {
    res.status(400).json({
        error: 'invalid url'
    })
})

server.listen(PORT, () => {
    console.log(`server running and listening on port: ${PORT}`)
}).on('error', (err) => {
    console.log('failed to start server: ', err)
})