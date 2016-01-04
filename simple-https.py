# Copyright RackN, 2015
# generate server.pem with the following command:
#    openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes
# run as follows:
#    python simple-https-server.py
# then in your browser, visit:
#    https://localhost:443

import BaseHTTPServer, SimpleHTTPServer
import ssl, sys

port = len(sys.argv) == 2 and int(sys.argv[1]) or 443
print "Starting UX Server on port %d (pass arg to override)" % (port)

httpd = BaseHTTPServer.HTTPServer(('0.0.0.0', port), SimpleHTTPServer.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket (httpd.socket, certfile='./server.pem', server_side=True)
httpd.serve_forever()
