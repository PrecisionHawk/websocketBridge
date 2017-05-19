// --- TODO ---
// Error handling
// validate/gracefully handle error states/packets
// handle LWT ( or whatever the native app sends onClose)

const WebSocket = require('ws');
const Stomp = require('stompjs');

const WS_URL = 'wss://latas-dev.weboapps.com/';

const wss = new WebSocket.Server({ 
	perMessageDeflate: false,
	port: 1515
});


wss.on('connection', function connection(ws) {
	console.log('--- Websocket connected ---');
	let stompClient;
	let firstMessage = true;
	let endpoint;

		ws.on('message', function incoming(message) {
			console.log('---WS RECEIVED--- \n %s', message);

			if(firstMessage === true) {
				let msg = JSON.parse(message)
				endpoint = msg.endpoint;

				console.log(WS_URL + endpoint);
				stompClient = Stomp.overWS(WS_URL + endpoint);

				stompClient.connect({endpoint: endpoint, token: msg.token}, function (frame) {
					console.log('---CONNECTED---- \n topic: ' + msg.topic);
					getViewport(stompClient, msg.region, endpoint);
					stompClient.subscribe(msg.topic.toString(), function (result) {
						console.log('---STOMP RECEIVED--- \n' + result.body);
						ws.send(result.body);
					});

				});
				firstMessage = false;
			} else {
				let region = JSON.parse(message)
				getViewport(stompClient, region, endpoint)
			}
		});

		ws.on('close', function close() {
			stompClient.disconnect()
			console.log('---WS & STOMP Disconnected--- \n endpoint: ' + endpoint);
		});
})

function getViewport(client, region, endpoint) {
	let viewport = convertRegionToViewport(region);
	client.send('/' + endpoint + 'App/' + endpoint, {}, JSON.stringify({
			'bottomLeftCoord': viewport.bottomLeftCoord, 'topRightCoord': viewport.topRightCoord, 'zoom':11
	}));
}

function convertRegionToViewport(region) {
	return {
		topRightCoord: (region.latitude - region.latitudeDelta/2) + ',' + (region.longitude - region.longitudeDelta/2),
		bottomLeftCoord: (region.latitude + region.latitudeDelta/2) + ',' + (region.longitude + region.longitudeDelta/2)
	}
}
