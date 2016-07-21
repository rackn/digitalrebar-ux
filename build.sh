# remove existing build dir
[ -d "_build" ] && rm -rf _build
mkdir _build
# compress css
node node_modules/cssnano-cli/cmd.js css/style.css _build/style.min.css 
# compress and mangle js
node_modules/uglify-js/bin/uglifyjs js/*.js js/lib/*.js --compress --mangle > _build/bundle.min.js 