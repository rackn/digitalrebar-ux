#! /usr/bin/python
import SimpleHTTPSServer
import json

class my_test(SimpleHTTPSServer.handler):
	"""docstring for my_test"""
	def __init__( self ):
		super(my_test, self).__init__()
		self.actions = [ ( 'post', '/', self.post_response ),
			( 'get', '/user/:username', self.get_user ),
			( 'get', '/:dir', self.index ) ]
		
	def post_response( self, method, page, data, variables ):
		form_data = self.form_data( data )
		output = json.dumps(form_data)
		headers = self.create_header()
		headers = self.add_header( headers, ( "Content-Type", "application/json") )
		return self.end_response( headers, output )
		
	def get_user( self, method, page, data, variables ):
		output = json.dumps(variables)
		headers = self.create_header()
		headers = self.add_header( headers, ( "Content-Type", "application/json") )
		return self.end_response( headers, output )
		
	def index( self, method, page, data, variables ):
		output = "Welcome"
		headers = self.create_header()
		headers = self.add_header( headers, ( "Content-Type", "text/html") )
		return self.end_response( headers, output )


def main():
	address = "0.0.0.0"
	port = 8000

	server = SimpleHTTPSServer.server( ( address, port ), my_test(), threading = True, key = 'server.key', crt = 'server.crt' )

if __name__ == '__main__':
	main()