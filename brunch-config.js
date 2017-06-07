module.exports = {
  npm: {
    enabled: true,
    styles: {
      'angular-material': ['angular-material.min.css'],
      'angular-material-data-table': ['dist/md-data-table.min.css'],
    },
    static: [
      'node_modules/jquery/dist/jquery.min.js',

      // Core Angular
      //'node_modules/angular/angular.min.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-route/angular-route.min.js',
      'node_modules/angular-cookies/angular-cookies.min.js',
      'node_modules/ng-debounce/dist/ng-debounce.js',
      'node_modules/angular-local-storage/dist/angular-local-storage.min.js',

      // Angular modules
      // Material
      'node_modules/angular-material/angular-material.min.js',
      'node_modules/angular-animate/angular-animate.min.js',
      'node_modules/angular-messages/angular-messages.min.js',
      'node_modules/angular-aria/angular-aria.min.js',
      'node_modules/angular-material-data-table/dist/md-data-table.min.js',

      // Vis
      'node_modules/vis/dist/vis.min.js',
      'node_modules/angular-visjs/angular-vis.js',

      // Digest Authentication
      'node_modules/angular-md5/angular-md5.min.js',
    ]
  },
  files: {
    javascripts: {
      joinTo: {
        'build.js': /^app/,
        'vendor.js': /^(vendor|node_modules)/,
      },
      order: {
        before: [
          'node_modules/jquery/dist/jquery.min.js',
          'vendor/jquery.sparkline.min.js',
          'node_modules/angular/angular.min.js',
          'node_modules/angular/angular.js',
          'node_modules/angular-route/angular-route.min.js',
          'node_modules/angular-cookies/angular-cookies.min.js',
          'node_modules/ng-debounce/dist/ng-debounce.js',
          
          'node_modules/angular-material/angular-material.min.js',
          'node_modules/angular-animate/angular-animate.min.js',
          'node_modules/angular-messages/angular-messages.min.js',
          'node_modules/angular-aria/angular-aria.min.js',
          'node_modules/angular-material-data-table/dist/md-data-table.min.js',
          
          'node_modules/vis/dist/vis.min.js',
          'node_modules/angular-visjs/angular-vis.js',
          
          'node_modules/angular-md5/angular-md5.min.js',
          'node_modules/angular-local-storage/dist/angular-local-storage.min.js',
          'vendor/digest.js',
          'vendor/angular-sparklines.js',
          'vendor/angular-clipboard.js',
          'vendor/jsontext.js',
          'vendor/ng-slide-down.min.js',
          'vendor/swap-md-paint.js',
          'app/js/app.js',
          /^app\//,
        ]
      }
    },
    stylesheets: {
      joinTo: 'build.css',
      order: {
        after: [
          'app/css/style.css'
        ]
      }
    }
  },
  modules: {
    allSourceFiles: true
  },
  plugins: {
    postcss: {processors: [require('autoprefixer')]},
    eslint: {
      pattern: /^app\/.*\.js/,
      warnOnly: true,
    }
  }
};
