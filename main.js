'use strict';//JavaScript 严格格式
var express = require("express");//调用express模块，该模块是web应用开发框架，可以快速地搭建一个完整功能的网站 参考：http://www.runoob.com/nodejs/nodejs-express-framework.html
var WebSocket = require("ws");//调用WebSocket模块，既包含了服务器端，又包含了客户端，参考：https://www.liaoxuefeng.com/wiki/001434446689867b27157e896e74d51a89c25cc8b43bdb3000/0014727922914053479c966220f47da91991fa9c27ac3ea000
var bodyParser = require('body-parser');//调用body-parser模块，这是中间件，分别是处理json数据、Buffer流数据、文本数据、UTF-8的编码的数据，参考https://www.cnblogs.com/yangyabo/p/5401812.html

var http_port = process.env.HTTP_PORT || 3001;//环境变量 HTTP服务器 节点的功能
var p2p_port = process.env.P2P_PORT || 6001;//环境变量 P2P服务器 Websocket HTTP服务器
//var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];//环境变量 节点信息，可能需要分解，例：ws://localhost:6001

var num = 0;

var MessageType = {//通信类型
    QUERY_LATEST: 0//最新的值
};

var sockets = [];//节点连接库

var initHttpServer = () =>{//控制节点的HTTP服务器  类似节点操作
    var app = express();
    app.use(bodyParser.json());

    app.get('/peers', (req, res) => {//获取显示网络中存在的节点，
        res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });
    app.post('/addPeer', (req, res) => {//请求添加新的节点{"peer" : "ws://localhost:6001"}
        connectToPeers([req.body.peer]);//添加新节点
        res.send([req.body.peer]);
    });

    app.get('/getNum', (req, res) => res.send(num));//显示num值
    app.post('/numAdd', (req, res) => {//执行操作num++
        num++;
        broadcast(responseLatestMsg());//广播
        console.log('block added: ' + num);//终端实时打印出新增区块
        res.send();
    });

    app.listen(http_port, () => console.log('Listening http on port: ' + http_port));//监听端口
}

//---建立P2P网络
var initP2PServer = () => {//P2P websocket全双工  服务器
    var server = new WebSocket.Server({port: p2p_port});
    server.on('connection', ws => initConnection(ws));
    console.log('listening websocket p2p port on: ' + p2p_port);
};

var initConnection = (ws) => {//初始化连接
    sockets.push(ws);//压入已连接的节点堆栈
    initMessageHandler(ws);//信息处理
    initErrorHandler(ws);//错误状态处理
    write(ws,responseLatestMsg());//广播
    console.log('new peer:'+ws._socket.remoteAddress + ':' + ws._socket.remotePort)
};

var initMessageHandler = (ws) => {//同步信息处理
    ws.on('message', (data) => {
        var message = JSON.parse(data);
    console.log('Received message' + JSON.stringify(message));
    switch (message.type) {
        case MessageType.QUERY_LATEST:
            handleNum(message);//写入最新的num
            break;
    }
});
};

var initErrorHandler = (ws) => {//错误信息处理
    var closeConnection = (ws) => {
        console.log('connection failed to peer: ' + ws.url +" "+ws._socket.remoteAddress + ':' + ws._socket.remotePort);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

var handleNum = (message) => {//同步区块链信息
    if (num<message.data) {
        num = message.data;
        console.log('We got new number ' + message.data);
        broadcast(responseLatestMsg());//有更新，向临近节点广播
    } else {
        console.log('received num is not max. Do nothing');
    }
};

var connectToPeers = (newPeers) => {//连接新节点  客户端
    newPeers.forEach((peer) => {
        var ws = new WebSocket(peer);
    ws.on('open', () => initConnection(ws));
    ws.on('error', () => {
        console.log('connection failed')
});
});
};

var responseLatestMsg = () => ({
    'type': MessageType.QUERY_LATEST,
    'data': num
});
var write = (ws, message) => ws.send(JSON.stringify(message));
var broadcast = (message) => sockets.forEach(socket => write(socket, message));


initHttpServer();
initP2PServer();