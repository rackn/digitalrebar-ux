#!/bin/bash
# Tool for minifying everything

# remove existing build dir and create new ones
[ -d "_build" ] && rm -rf _build
mkdir _build 
mkdir _build/css 

# copy base files
echo Moving Images
cp favicon.ico _build/favicon.ico 
cp css/*.* _build/css 

# css bundle
echo Copying CSS
cat css/style.css \
bower_components/angular-material/angular-material.css \
bower_components/angular-material-data-table/dist/md-data-table.min.css \
> _build/css/style.temp.css

# compress css bundle
echo Compressing CSS
node node_modules/cssnano-cli/cmd.js _build/css/style.temp.css > _build/css/style.css 
rm _build/css/style.temp.css

# compress and mangle js
echo Compressing JS
node_modules/uglify-js/bin/uglifyjs \
bower_components/angular/angular.min.js \
bower_components/jquery/dist/jquery.min.js \
bower_components/angular-route/angular-route.min.js \
bower_components/angular-cookies/angular-cookies.min.js \
bower_components/ng-debounce/angular-debounce.js \
bower_components/angular-material/angular-material.min.js \
bower_components/angular-animate/angular-animate.min.js \
bower_components/angular-messages/angular-messages.min.js \
bower_components/angular-aria/angular-aria.min.js \
bower_components/angular-material-data-table/dist/md-data-table.min.js \
bower_components/angular-md5/angular-md5.min.js \
bower_components/angular-local-storage/dist/angular-local-storage.min.js \
bower_components/swap-md-paint/swap-md-paint.js \
js/*.js \
js/lib/*.js \
--stats --compress > _build/bundle.min.js 

# remove extra script and css tags
echo Compressing HTML
cat index.html | sed -e ':a;N;$!ba;s/<script src="\(js\|bower\)\(.\|\n\)\+<\/script>/<script src="bundle.min.js"> <\/script>/g' | sed -e 's/^.\+<link.\+href\="bower.\+$//g' > _build/index.temp.html

# compress html
node node_modules/html-minifier/cli.js _build/index.temp.html --collapse-whitespace --minify-css minify-js --remove-comments --remove-tag-whitespace -o _build/index.html 
rm _build/index.temp.html
node node_modules/html-minifier/cli.js --input-dir views/ --output-dir _build/views --collapse-whitespace --minify-css minify-js --remove-comments --remove-tag-whitespace 
