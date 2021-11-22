const express = require("express");
const { createServer } = require("http");
const request = require("request");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

const db = require("./../db/connect");

const bodyParser = require("body-parser");

app.use(bodyParser.json());

app.all("*", function (req, res, next) {
  //设置允许跨域的域名，*代表允许任意域名跨域
  res.header("Access-Control-Allow-Origin", "*");
  //允许的header类型
  res.header("Access-Control-Allow-Headers", "*");
  //跨域允许的请求方式
  res.header("Access-Control-Allow-Methods", "*");
  if (req.method.toLowerCase() == 'options') res.send(200);  //让options尝试请求快速结束
  else next();
});

import Phone from "./../db/model/Phone";
import User from "./../db/model/User";
import Log from "./../db/model/Log";
import Code from "./../db/model/Code";
import Chat from "./../db/model/Chat";

app.post("/messageCode", (req, res) => {
  let phone = req.body.phone;
  Phone.findOne({ phone })
    .then((data) => {
      if (data) {
        User.findOne({ phone }).then((doc) => {
          if (doc) {
            res.json({
              code: 0,
              msg: "该手机号已被注册，请返回登录",
            });
          } else {
            let codeNum = randomNum(6);
            let url = "https://sms.yunpian.com/v2/sms/single_send.json";
            let form = {
              apikey: "ca7206fec3d60c4d1f6cdbdf86fd6118",
              mobile: phone,
              text: `【秦祥】您的验证码是${codeNum}。如非本人操作，请忽略本短信`,
            };
            request.post({ url, form }, (error, response, body) => {
              if (error) {
                console.log(error);
              }
              body = JSON.parse(body);
              if (body.code == 0) {
                res.json({
                  code: 1,
                  msg: "发送成功",
                });
                Code.findOne({ phone }).then((codeDoc) => {
                  if (codeDoc) {
                    Code.updateOne({ phone }, { code: codeNum }).then(() => {});
                  } else {
                    let code = new Code({
                      phone,
                      code: codeNum,
                      time: new Date().getTime(),
                    });
                    code.save().then(() => {});
                  }
                });
              } else {
                res.json({
                  code: 0,
                  msg: "发送失败",
                });
                let log = new Log({
                  params: JSON.stringify(form),
                  msg: body.msg,
                  time: new Date().getTime(),
                });
                log.save().then(() => console.log("错误日志已添加"));
              }
            });
          }
        });
      } else {
        res.json({
          code: 0,
          msg: "该手机号未授权，请联系管理员",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.json({
        code: 0,
        msg: "error",
      });
    });
});

const io = new Server(httpServer, {
  path: "/socket/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

httpServer.listen(3000);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/addPhone", (req, res) => {
  const phoneInfo = new Phone({ phone: req.query.phone });
  phoneInfo
    .save()
    .then((data) => {
      console.log(`新增授权手机号(${req.query.phone})成功`);
      res.json({
        code: 1,
        msg: "success",
      });
    })
    .catch((err) => {
      console.log(err);
      res.json({
        code: 0,
        msg: "error",
      });
    });
});

app.post("/register", (req, res) => {
  let phone = req.body.phone;
  Code.findOne({ phone: req.body.phone }).then((doc) => {
    if (doc.code != req.body.code) {
      res.json({
        code: 0,
        msg: "验证码错误",
      });
    } else {
      User.findOne({ phone }).then((findUser) => {
        if(findUser) {
          res.json({
            code: 0,
            msg: "该手机号已被注册，请返回登录"
          })
        } else {
          let time = new Date().getTime()
          let user = new User({
            phone: req.body.phone,
            name: req.body.name,
            psw: req.body.psw,
            time
          })
          user.save().then((userDoc) => {
            if (userDoc) {
              res.json({
                code: 1,
                msg: "注册成功，请登录",
              });
            } else {
              res.json({
                code: 0,
                msg: "注册失败，请联系管理员",
              });
            }
          });
        }
      })
    }
  });
});

app.post("/login", (req, res) => {
  let phone = req.body.phone
  let psw = req.body.psw
  User.findOne({phone}).then((doc) => {
    if (!doc) {
      res.json({
        code: 0,
        msg: '该手机号尚未注册，请先注册'
      })
    } else {
      if (doc.psw == psw) {
        res.json({
          code: 1,
          token: phone,
          msg: '登录成功'
        })
      } else {
        res.json({
          code: 0,
          msg: '手机号或密码错误'
        })
      }
    }
  })
})

app.post("/chatHistory", (req, res) => {
  let phone = req.get('Authorization')
  if (phone) {
    User.findOne({phone}).then((doc) => {
      if (doc) {
        let chatId = req.body.chatId
        if (chatId) {
          Chat.find({_id: {$lt: chatId}}).sort([['_id',-1]]).limit(20).then((doc) => {
            let data = doc.reverse()
            data.forEach(e => {
              User.findOne({phone: e.phone}).then((userDoc) => {
                if (userDoc) {
                  e.name = userDoc.name
                } else {}
              })
            })
            res.json({
              code: 1,
              data
            })
          })
        } else {
          Chat.find().sort([['_id',-1]]).limit(20).then((doc) => {
            if (doc.length > 0) {
              let list = doc.reverse();
              let num = 0;
              let data = [];
              list.forEach((e, index) => {
                User.findOne({ phone: e.phone }).then((userDoc) => {
                  if (userDoc) {
                    data.push({
                      _id: e._id,
                      phone: e.phone,
                      content: e.content,
                      time: e.time,
                      name: userDoc.name,
                    });
                  } else {
                  }
                  num++;
                  if (num == list.length) {
                    console.log(data);
                    console.log(999);
                    res.json({
                      code: 1,
                      data,
                    });
                  }
                });
              });
            } else {
              res.json({
                code: 1,
                data: doc
              })
            }
          })
        }
      } else {
        res.json({
          code: -2,
          msg: '登录已失效，请重新登录'
        })
      }
    })
  } else {
    res.json({
      code: -2,
      msg: '登录已失效，请重新登录'
    })
  }
})

app.post("/userInfo", (req, res) => {
  let phone = req.get('Authorization')
  if (phone) {
    User.findOne({phone}).then((doc) => {
      if (doc) {
        res.json({
          code: 1,
          data: {
            phone: doc.phone,
            name: doc.name
          }
        })
      } else {
        res.json({
          code: -2,
          msg: '登录已失效，请重新登录'
        })
      }
    })
  } else {
    res.json({
      code: -2,
      msg: '登录已失效，请重新登录'
    })
  }
})

app.post("/sendMsg", (req, res) => {
  let phone = req.get('Authorization')
  let content = req.body.content
  let time = new Date().getTime()
  User.findOne({phone}).then((userDoc) => {
    if (userDoc) {
      if (userDoc.isStop) {
        res.json({
          code: 0,
          msg: '您已被禁言'
        })
      }
      let name = userDoc.name
      let chat = new Chat({ phone, content, time })
      chat.save().then((chatDoc) => {
        let params = {
          sendTime: req.body.sendTime,
          phone: chatDoc.phone,
          content: chatDoc.content,
          name,
          _id: chatDoc._id
        }
        console.log('io emit')
        io.emit("newMsg", params)
        res.json({
          code: 1,
          msg: '发送成功'
        })
      }).catch((err) => {
        console.log(err)
        res.json({
          code: 0,
          msg: '发送失败'
        })
      })
    } else {
      res.json({
        code: -2,
        msg: '登录已失效，请重新登录'
      })
    }
  })
})

app.post("/editName", (req, res) => {
  let phone = req.get('Authorization')
  let name = req.body.name
  if (phone) {
    User.findOne({phone}).then((userDoc) => {
      if (userDoc) {
        User.updateOne({ phone }, { name }).then(() => {
          res.json({
            code: 1,
            msg: '修改成功'
          })
        });
      } else {
        res.json({
          code: -2,
          msg: '登录已失效，请重新登录'
        })
      }
    })
  } else {
    res.json({
      code: -2,
      msg: '登录已失效，请重新登录'
    })
  }
})

app.post("/chatStateIn", (req, res) => {
  let phone = req.body.phone
  User.findOne({phone}).then((doc) => {
    if (doc.name) {
      io.emit('chatStatusIn', doc.name+'进入了聊天室')
    }
  })
  res.json({
    code: 1
  })
})

app.post("/chatStateOut", (req, res) => {
  let name = req.body.name
  if (name) {
    io.emit('chatStatusOut', name+'离开了聊天室')
  }
  res.json({
    code: 1
  })
})

// app.post("/chatStateChange", (req, res) => {
//   let name = req.body.name
//   let text = req.body.text
//   let status
//   if (text == '进入') {
//     status = 1
//   } else {
//     status = 0
//   }
//   if (name && text) {
//     io.emit('chatStatus', {status,msg: name+text+'了聊天室'})
//   }
//   res.json({
//     code: 1
//   })
// })

io.on("connection", (socket) => {
  // ...
  console.log("socket connected");
  // socket.emit("msg", 22222);
});

io.on("chatOut", (msg) => {
  console.log(msg + 'out')
})

io.on("chatIn", (msg) => {
  console.log(msg + 'in')
})



// io.on("add", (data) => {
//   let phone = data.phone
//   let content = data.content
//   let time = new Date().getTime()
//   User.findOne({phone}).then((userDoc) => {
//     if (userDoc) {
//       if (userDoc.isStop) {
//         res.json({
//           code: 0,
//           msg
//         })
//       }
//       let name = userDoc.name
//       let bgColor = userDoc.bgColor || '#2979ff'
//       let chat = new Chat({ phone, content, time, name, bgColor })
//       chat.save().then((chatDoc) => {
//         delete chatDoc._id
//         io.emit("new", chatDoc)
//       })
//     } else {
//       res.json({
//         code: -2,
//         msg: '登录已失效，请重新登录'
//       })
//     }
//   })
// })

function randomNum(n) {
  var res = "";
  for (var i = 0; i < n; i++) {
    res += Math.floor(Math.random() * 10);
  }
  return res;
}
