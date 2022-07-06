const http = require('http');
const https = require('https');
var net = require('net');
function main() {
	const server = http.createServer(function (req, res) {
	    //console.log(req.headers);
	    //console.log(req.url);
	    console.log("Serving HTTP request");
	    if (req.url === "http://connectivitycheck.gstatic.com/generate_204" || !req.url || !(req.url.startsWith("https://") || req.url.startsWith("http://"))) {
	        res.writeHead(301, { Location: "https://www.google.com" });
	        res.write("That's not where you want to go!");
	        res.end();
	    }
	    else {
	        const out_req = (req.url.startsWith("https") ? https : http).request(req.url, { headers: req.headers, method: req.method });
	        out_req.on("response", out_res => {
	            res.writeHead(out_res.statusCode, out_res.headers);
	            out_res.pipe(res, true);
	        });
	        out_req.on("error", err => {
	            res.writeHead(500);
	            res.write(err.name);
	            res.write(err.message);
	            res.end();
	        })
	        req.pipe(out_req, true);
	    }
	});
	const regex_hostport = /^([^:]+)(:([0-9]+))?$/;
	const getHostPortFromString = function (hostString, defaultPort) {
	    var host = hostString;
	    var port = defaultPort;

	    var result = regex_hostport.exec(hostString);
	    if (result != null) {
	        host = result[1];
	        if (result[2] != null) {
	            port = result[3];
	        }
	    }

	    return ([host, port]);
	};
	server.addListener('connect', function (req, socket, bodyhead) {
	    console.log("Connect event.");
	    var hostPort = getHostPortFromString(req.url, 443);
	    var hostDomain = hostPort[0];
	    var port = parseInt(hostPort[1]);
	    console.log("Proxying HTTPS request");

	    var proxySocket = new net.Socket();
	    proxySocket.connect(port, hostDomain, function () {
	        proxySocket.write(bodyhead);
	        socket.write("HTTP/" + req.httpVersion + " 200 Connection established\r\n\r\n");
	    }
	    );

	    proxySocket.on('data', function (chunk) {
	        socket.write(chunk);
	    });

	    proxySocket.on('end', function () {
	        socket.end();
	    });

	    proxySocket.on('error', function () {
	        socket.write("HTTP/" + req.httpVersion + " 500 Connection error\r\n\r\n");
	        socket.end();
	    });

	    socket.on('data', function (chunk) {
	        proxySocket.write(chunk);
	    });

	    socket.on('end', function () {
	        proxySocket.end();
	    });

	    socket.on('error', function () {
	        proxySocket.end();
	    });

	});
	server.on("error", err => {
		console.log(err);
	});
	server.listen(80);
}
function main2() {
	try {
		main();
	} catch (e) {
		console.log(e);
		main2();
	}
}
main2();
