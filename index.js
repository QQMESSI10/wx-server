// const express = require("express");
// const { createServer } = require("http");
// const { Server } = require("socket.io");

// const app = express();
// const httpServer = createServer(app);

// const db =  require("./db/connect");


// app.all("*",function(req,res,next){
//   //设置允许跨域的域名，*代表允许任意域名跨域
//   res.header("Access-Control-Allow-Origin","*");
//   //允许的header类型
//   res.header("Access-Control-Allow-Headers","content-type");
//   //跨域允许的请求方式
//   res.header("Access-Control-Allow-Methods","DELETE,PUT,POST,GET,OPTIONS");
//   if (req.method.toLowerCase() == 'options')
//     res.send(200);  //让options尝试请求快速结束
//   else
//     next();
// });

// const io = new Server(httpServer, { 
//   path: '/socket/',
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   },
// });

// httpServer.listen(3000);

// const Phone = require("./db/model/Phone")

// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/index.html");
// });

// app.get("/addPhone", (req, res) => {
//   const phoneInfo = new Phone({phone: req.query.phone})
//   phoneInfo.save().then((data) => {
//     console.log(data)
//     res.json({
//       code: 200,
//       msg: 'success'
//     })
//   }).catch((err) => {
//     console.log(err)
//     res.json({
//       code: 500,
//       msg: 'error'
//     })
//   })
  
// })

// app.post("/Code", (req, res) => {
//   console.log(req.body)
//   let num = randomNum(6)
//   console.log(num)
//   res.json({
//     code: 200,
//     msg: num
//   })
// })

// app.get("/register", (req, res) => {

// })

// io.on("connection", (socket) => {
//   // ...
//   console.log("a user connected");
//   socket.emit('msg', 22222)
// });

// function randomNum(n){
//   var res = "";
//   for(var i=0;i<n;i++){
//     res += Math.floor(Math.random()*10);
//   }
//   return res;
// }

require('babel-register') ({
  presets: [ 'env' ]
})

module.exports = require('./src/app.js')