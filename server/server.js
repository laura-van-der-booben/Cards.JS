//	server/server.js
"use strict";
/**
 * Server module coordinates requests and apps.
 * 
 * There are two primary types:
 * 
 * - Server - is a logical representation of listener.
 * - Global server controller - is a logical representation of an interface.
 * 
 * There are following files:
 * - server/server.js
 *   - Server pipeline
 * - server/serverController.js
 *   - App distribution and initialization
 *   - Redirections, http codes processing
 * @module server
 */
const http = require("http");
const https = require("https");
const nunjucks = require("nunjucks");
const sass = require("node-sass");
const system = require("../system/system.js"); 

/**
 * Server or "listener"
 * @param {module:app~App} [app=null] - App to instantiate on server creation
 */
class Server{
	// Constructor
	constructor(settings, app){
		// Init server structure
		this.apps = new Array(); // Create the app pool
		this.routes = {};　// Define app routes
		this.settings = settings; // Set settings

		// Add app if provided
		if(app){
			this.addApp(app);
		}
	}

	/**
	 * Start the server 
	 * @instance
	 */
	startServer (){
		// Create server
		this.server = http.createServer((request, response) => processRequest(request, response, this));

		// Start listening
		this.server.listen(this.settings);

		// Log the status to the console
		console.log('Server listening @ ' + this.settings.host + ':' + this.settings.port);

		/* Handling http.Server events, additional to net.Server */
		// TODO: Event: 'checkContinue'
		// TODO: Event: 'checkExpectation'

		// Event: 'clientError' - Gracefully close connection on client error; Client connection socket forwards it's error event here. The socket would be terminated if not handled.
		this.server.on('clientError', (err, socket) => {
			socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
		});

		// TODO: Event: 'connect'
		// TODO: Event: 'connection' - For some reason this is listed as additional to net.Server, but it seems it is inherited
		// TODO: Event: 'request'
		// TODO: Event: 'upgrade'

		/* Handling http.Server inherited events from net.Server */
		// TODO: Event: 'close'
		// TODO: Event: 'connection'
		// TODO: Event: 'error'
		// TODO: Event: 'listening'
	}

	/**
	 * Add an app to the server app pool
	 * @param {module:app~App} app 
	 * @instance
	 */
	addApp (app){
		// The push should go by reference
		this.apps.push(app);
		
		// Reconstruct route table
		this.reconstructRouteTable();
	}

	/**
	 * Stop and remove the app from the app pool, then reconstruct the routing table
	 * @param {module:app~App} app 
	 * @instance
	 */
	removeApp (app){
		// TODO: add removal of app code
	}

	/**
	 * Start the app from the pool
	 * @param {module:app~App} app 
	 * @instance
	 */
	startApp (app){
		// TODO: add starting of app
	}

	/**
	 * Stop the app from the pool
	 * @param {module:app~App} app 
	 * @instance
	 */
	stopApp (app){
		// TODO: add stopping of app
	}

	/**
	 * Reconstruct the routing table to correspond to the modified app pool
	 * @instance
	 */
	reconstructRouteTable (){
		// We verify locally, not centrally, the types of the endpoints array and it's elements, as this function only runs when there is a change in app pool
		// TODO: This will reconstruct the route table by which the server determines which app to use
		// FIXME: For now, we will be taking only a single endpoint from our first app

		let that = this;
		
		// Verify that endpoints is an array
		if (!Array.isArray(this.apps[0].endpoints)){
			console.error("Application endpoints corrupt.")
			throw 500;
		}

		this.apps[0].endpoints.forEach(function(element) {
			if ((typeof element) !== "string"){
				console.error("Application endpoints corrupt.")
				throw 500;
			}
			that.routes[element] = 0;
		});

		// How deep does the route tree go down
		this.routesDepth = 1;
	}
}
/**
 * 
 * @private
 * @param {any} url 
 * @returns {Array}
 */
var pathToArray = function (url) {
	// Define array
	var pathArray = url.split("/");

	// Cache length
	let pathArrayLength = pathArray.length;

	// Ensure that there is always a "/" at the beginning
	if((pathArrayLength < 2) || (pathArray[0] != "")){
		throw 400; // Bad request, whatever
	}

	// Remove the last space is present; Array length is guaranteed to be >= 2 
	if(pathArray[pathArrayLength - 1] == ""){
		pathArray.splice(pathArrayLength - 1 , 1);
	}

	// Remove empty space from splice of first "/"; The first array element is guaranteed to be empty
	pathArray.splice(0, 1);

	return pathArray;
}

/**
 * Processes the request; currently is performing a role of a route table as well
 * @private
 * @async
 * @param {any} request 
 * @param {any} response 
 * @param {any} server 
 */
async function processRequest(request, response, server){
	try{
		// Determine requested path
		var requestPath = pathToArray(request.url);

		// Determine which app endpoint url directs to
		// FIXME: Add depth check, and endpoint logic
		var serverPath = server.routes;
		let app;
		for (
				// Set counter, maximum depth, array length, and initial traverse point to root
				let i = 0, depth = server.routesDepth, requestPathLength = requestPath.length, serverPath = server.routes;
				// We should not go lower than contstructed routes
				i < depth;
				// Move traverse point down and iterate counter
				// NOTE: order is important
				serverPath=serverPath[requestPath[i]], i++
			) {
			// Check if the requested path was just too short
			if(requestPathLength == i){
				throw 500;
			}
				
			// Traveling down
			if(serverPath.hasOwnProperty(requestPath[i])){
				// Check if reached the bottom of the routes tree
				if((typeof serverPath[requestPath[i]]) === "number"){
					app = server.apps[serverPath[requestPath[i]]];
					break;
				}
			} else { // There is no such requested path in the intermediate node
				throw 500;
			}
		}

		// Throw error if url not matched
		// TODO: IF path not in array throw bad request

		// Match url
		// TODO: Get the url with the system function

		// Determine HTTP method
		var request_method = request.method;

		// Throw error if method is not matched
		// TODO: If method not in allowed methods throw 405 Method Not Allowed

		// Determine the functions to be used
		// TODO: We have some array or something, where we extract the functions to use based on method and path


		var responseData = "";

		// Extract POST body
		if (request_method == 'post'){
			await extractBody(request);
		}

		// TODO: Route to app

		/*
		var formattedData = await requestFormatter();
		var processedData = await dataProcessing(formattedData);
		var responseData = await responseFormatter(processedData);
		*/

		// Temp identity pathing
		console.log(request.url);
		await app.getResource(app.getResourceByPath(request.url, app.paths)).then(result => responseData=result[0]);
	} catch (thrownErrorCode) {
		let errorCode = thrownErrorCode;

		console.log(thrownErrorCode);
		// FIXME: Do a proper response query
		responseData = "500";
	} finally {
		// Set headers
		// TODO: ??

		// End response
		response.end(responseData);
	}
}

/** Extracts POST body from request */
var extractBody = function(request){ 
	return new Promise(function(resolve, reject){
		// Hold POST request data
		var postData = '';

		/* Handling http.IncomingMessage events of additional to stream.Readable */
		// Event: 'close'

		// Event: 'data' - Get the data from body
		request.on('data', function (data) {
			postData += data;
			
			// We do have some post limit, actually let it be 64KB
			// if size of req_postData exceeds 64KB reject with 413 Payload Too Large
		});

		// Event: 'end' - When the transmission ended
		request.on('end', function () {
			resolve(postData);
		});

		// TODO: Event: 'error'
		// TODO: Event: 'readable'

		/* Handling http.IncomingMessage events inherited from stream.Readable */
		// TODO: Event: 'aborted'
		// TODO: Event: 'close'
	});
}

module.exports = {
	Server : Server
}