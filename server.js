var http = require('http')
var serverPort = 4444

const {exec} = require("child_process")

http.createServer(function (request, response) {
    if (request.method !== "POST") {
        response.writeHead(404, 'Resource Not Found', {'Content-Type': 'text/html'})
        response.end('404')
    } else {
        response.setHeader("Content-Type", "text/json")

        var requestBody = ''
        request.on('data', function (data) {
            requestBody += data
            if (requestBody.length > 1e7) {
                error(response, 'Request too large')
            }
        })

        request.on('end', function () {
            if (requestBody.trim() == '') {
                return error(response, 'empty request')
            }

            try {
                const data = JSON.parse(requestBody)

                if (!data.action) {
                    return error(response, 'invalid json (no port specified)')
                }

                runAction(response, data.action, data)
            } catch (e) {
                console.error(e)
                return error(response, 'invalid json')
            }
        })
    }
}).listen(serverPort)

console.log('Server running at localhost:' + serverPort)

function error(response, text) {
    response.end(JSON.stringify({
        status: 400,
        text
    }))
}

function success(response, text) {
    response.setHeader('Content-Type', 'application/json')

    response.end(JSON.stringify({
        status: 200,
        text: text
    }))
}

function runAction(response, action, data) {
    if (action === 'create') {
        return runCreateApp(response, data)
    }

    if (action === 'delete') {
        return runDeleteApp(response, data)
    }

    if (action === 'status') {
        return runGetStatus(response, data)
    }

    error(response, 'Unknown action')
}

function runGetStatus(response, data) {
    if (!data.port) {
        return error(response, 'No port specified')
    }

    exec(`ps aux | grep -- "-p ${data.port}"`, (err, stdout, stderr) => {
        if (err || stderr) {
            return error(response, 'GetStatus Error: ' + (err || stderr))
        }

        if (stdout.includes('rasa run')) {
            return success(response, stdout)
        }

        error(response, '')
    })
}

function runCreateApp(response, data) {
    if (!(data.port && data.port >= 6000 && data.port < 7000)) {
        return error(response, 'No port specified')
    }

    exec(`./create.sh ${data.port}`, (err, stdout, stderr) => {
        if (err || stderr) {
            return error(response, 'CreateApp Error: ' + (err || stderr))
        }

        return success(response, stdout)
    })
}
