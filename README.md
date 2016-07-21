### Get the modules

1. `sudo apt-get install npm`

2. `npm install -g bower`

3. `sudo apt-get install nodejs nodejs-legacy`

4. `cd /path/to/dir/`

5. `bower install`

### Create a certificate

1.  generate server.pem with the following command:

    * `openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes`

2. place `server.pem` in the same location as `simple-https.py`

### See it in action

1. `cd /path/to/dir/`

2. `python simple-https.py [port]`

3. Open `https://localhost` in any browser (reminder: add [port] if given)

### Minify

1. `npm install cssnano-cli html-minifier uglify-js`

2. `./build.sh`
