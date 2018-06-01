
# P2PNodejs
P2PNodejs--this is a smiple example which is based on nodejs to realize the P2P network

### Quick start
```
npm install
HTTP_PORT=3001 P2P_PORT=6001 npm start
HTTP_PORT=3002 P2P_PORT=6002 npm start
curl -H "Content-type:application/json" --data '{"peer" : "ws://localhost:6001"}' http://localhost:3001/addPeer
#win
set HTTP_PORT=3001  set P2P_PORT=6001 npm start
set HTTP_PORT=3002 set P2P_PORT=6002  npm start
curl -H "Content-type:application/json" --data "{\"peer\" : \"ws://localhost:6001\"}" http://localhost:3001/addPeer

#view Peers
curl http://localhost:3001/addPeer 

#operations
curl -H "Content-type:application/json" --data "" http://localhost:3001/numAdd
curl http://localhost:3001/getNum
