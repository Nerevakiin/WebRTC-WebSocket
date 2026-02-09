import express from 'express'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { WebSocketServer, WebSocket } from 'ws'
import cors from 'cors'

const app = express()
const PORT = 8000


// creating the options object with the files created by the OpenSSL command 
const serverOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}


app.use(cors({
    origin: `https://192.168.100.3:${PORT}`,
    credentials: true
})) 

app.use(express.json())

app.use(express.static('public'))


// create the HTTPS server passing the options and the express app
const server = https.createServer(serverOptions, app)

// Connect the WebSocket server to the HTTPS server
const wss = new WebSocketServer({ server }) // pass the HTTP server here

// ======= WEB SOCKET ===========

wss.on('connection', (ws) => {
    
    ws.on('error', console.error)

    console.log('NEW WEBSOCKET CONNECTION')

    ws.on('message', (data) => {
        
        console.log('RECEIVED: ', data.toString())

        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data.toString())
            }
        })
    })

    ws.send(JSON.stringify({
        type: 'system',
        text: 'blablabla'
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