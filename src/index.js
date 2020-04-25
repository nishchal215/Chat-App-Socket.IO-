const express = require('express'),
    app=express(),
    http=require('http'),
    server=http.createServer(app),
    socketio=require('socket.io'),
    io=socketio(server),
    path=require('path'),
    port= process.env.PORT || 3000,
    publicDirectoryPath=path.join(__dirname,'../public'),
    {generateMessage,generateLocationMessage}=require('./utils/messages'),   //{} is used to grap one property and use it as a stand alone variable
    {addUser, removeUser, getUser, getUsersinRoom}=require('./utils/users')


app.use(express.static(publicDirectoryPath))

// 
io.on('connection',(socket)=>{    // on event 'connection' which is a pre defined event log new connection

// socket is the identity of a particular client

    console.log('New connection')


    socket.on('join',(options, callback)=>{
        const {error,user} = addUser({ id:socket.id, ...options })  // ... is spread operator

        if(error){
            return callback(error)
        }

        socket.join(user.room)   // predefined function to join a room


        socket.emit('message',generateMessage('Admin','Welcome!'))   // message is name of event which client will be listening for ans on connecting
    
        console.log('Joined a room')

        // brodcast function calls emit function for all client other than the current one
        // socket.broadcast.to is similar to socket.broadcast only diff being that it broadcasts only to a given room
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined`))

        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersinRoom(user.room)
        })

        callback()

    })

    socket.on('sendMessage', (message,callback)=>{

        const user = getUser(socket.id)

        // socket.emit('message',message)   this is not used because it will emit the message only for 1 socket which 
        // is the current one so for emitting on all clients we use io.emit

        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('sendLocation',(position , callback)=>{

        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback()
    })

    // for disconnecting we use socket.on 
    socket.on('disconnect',()=>{

        const user = removeUser(socket.id)

        if(user){
            // io.emit is used cause th current socket has already left the chat
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`));

            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersinRoom(user.room)
            })
        }

    })

})

server.listen(port, () => {
    console.log(`Server is up on ${port}!`)     // using '...' instead of  '...' because we are using es6 template string
                                                // and ` ` is used for template string
})