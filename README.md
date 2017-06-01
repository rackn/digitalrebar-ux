### Get the modules

1. `sudo apt-get install npm`

2. `npm install -g brunch`

3. `npm install --dev`

4. `brunch build` or `brunch watch`

### Create a certificate

1.  generate server.pem with the following command:

    * `openssl req -new -x509 -keyout server-key.pem -out server.pem -days 365 -nodes`

2. place `server.pem` in the same location as `simple-https.py`

### See it in action

1. `cd /path/to/dir/`

2. `python2 simple-https.py [port]`

3. Open `https://localhost/public` in any browser (reminder: add [port] if given)
