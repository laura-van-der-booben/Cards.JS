// Global
const http = require('http');
const master = require('./master.js');
const usage = require('./use.js');

// Create the server
const server = http.createServer(function (request, response) {
    // Switch on url
    switch(request.url){
        // Case "Master"
        case '/master':
            master.main(request, response);
            break;
        case '/master/pool_sync':
            master.pool_sync(request, response);
        case '/use':
            usage.main(request,response);
            break;
        case '/use/card_id':
            usage.card_id(request,response);
            break;
        // Welcome:
        default:
            response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
            response.end('Wrong url');
    }
});
 
// Start listening
server.listen(8080);

// Log the status to the console
console.log('Server running at *:8080');

/* Handling http.Server events, additional to net.Server */
// Event: 'checkContinue'
// Event: 'checkExpectation'

// Event: 'clientError' - Gracefully close connection on client error; Client connection socket forwards it's error event here. The socket would be terminated if not handled.
server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

// Event: 'connect'
// Event: 'connection' - For some reason this is listed as additional to net.Server, but it seems it is inherited
// Event: 'request'
// Event: 'upgrade'

/* Handling http.Server inherited events from net.Server */
// Event: 'close'
// Event: 'connection'
// Event: 'error'
// Event: 'listening'