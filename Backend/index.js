/******* CONEXION A LA BASE DE DATOS ***** */
'use strict'


var mongoose = require('mongoose');
var app=require('./app');
const socketio = require('socket.io')
const http = require('http')

var port= process.env.PORT || 3900;//variable puerto. El que queremos utilizar
var url= process.env.MONGO_DB;

//variables de entorno locales
require('dotenv').config({path: 'variables.env'});

console.log(process.env.MONGO_DB);
 

mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;



//
//mongoose.connect('mongodb+srv://anamorales13:vBac1UreWvszfgNe@plataforma.2cxua.mongodb.net/test?retryWrites=true&w=majority',{ useUnifiedTopology: true, useNewUrlParser: true})
mongoose.connect(url || "mongodb://localhost:27017/baseerasmus",{ useUnifiedTopology: true, useNewUrlParser: true})        
.then(()=>{
            console.log('La conexion a la BD se ha realizado con exito');

            app.listen(port, ()=> {
                console.log('servidor corriendo en http://localhost:'+port );
            
            });
        });

    

//Connect socket
/*
const client= require('socket.io').listen(3100).sockets;*/
const server = http.createServer(app);//creando el server con http y express como handle request
const client = socketio(server);

const {addUser, removeUser, getUser, getUserInRoom} =require('./controllers/user');


server.listen(port, () => {
    console.log("Server running in http://localhost:"+port)
  })

  

client.on('connection', (socket) => {
   
    socket.on('join', ({name, room}, callback)=>{
        const {error, user}= addUser({id:socket.id, name, room});
        
        if(error) return callback (error);
        
        socket.emit('message', {user:'admin', text:`${user.name}, Bienvenido a la sala ${user.room}`});
        socket.broadcast.to(user.room).emit('message',{user:'admin', text:`${user.name}, se acaba de unir!`});

        socket.join(user.room);

        client.to(user.room).emit('roomData', {room: user.room, users: getUserInRoom(user.room)})

        callback();
    });

    socket.on('sendMessage', (message, callback)=>{
      
        const user=getUser(socket.id);
      
        client.to(user.room).emit('message', {user:user.name, text:message});
        client.to(user.room).emit('roomData', {room: user.room, users: getUserInRoom(user.room)});
        callback();
    });


    socket.on('disconnect', () => {
       const user= removeUser(socket.id);

       if(user){
           client.to(user.room).emit('message', {user:'admin', text:`${user.name} ha abandonado la sala.`})
       }
    })
    
});