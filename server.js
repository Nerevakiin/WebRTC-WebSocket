import express from 'express'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import cors from 'cors'

const app = express()
const PORT = 8000



app.use(cors({
    origin: `http://192.168.100.5:${PORT}`,
    credentials: true
})) 

app.use(express.json())


app.use(express.static('public'))


const server = createServer(app)

const wss = new WebSocketServer({ server }) // pass the HTTP server here

// ======= WEB SOCKET ===========

wss.on('connection', (ws) => {
    
    ws.on('error', console.error)


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