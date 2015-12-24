(function(){
    var app = angular.module('app', ['ngRoute', 'dgAuth']);
        console.log('start')

    app.config(function($routeProvider, dgAuthServiceProvider) {
        console.log("Config")
        
        dgAuthServiceProvider.setConfig({
            login: {
                method: 'GET',
                url: 'https://rack1:3000/api/v2/digest'
            },
            logout: {
                method: 'POST',
                url: 'https://rack1:3000/api/v2/digest'
            }
        });

        dgAuthServiceProvider.setHeader('');
        

        $routeProvider.
            when('/', {
                controller: 'DashboardController',
                templateUrl: 'dashboard.html',
            }).
            when('/login', {
                controller: 'LoginController',
                templateUrl: 'login.html',
            }).
            otherwise({
                redirectTo: '/login'
            })
    });

    app.controller('LoginController', ['$scope', 'dgAuthService', '$http', function($scope, dgAuthService, $http) {
        console.log('login: ' + dgAuthService)
        this.credentials = {
            username: 'user',
            password: 'pass'
        }

        this.signIn = function() {
            dgAuthService.start();
            dgAuthService.setCredentials(this.credentials.username, this.credentials.password);
            dgAuthService.signin();
        }

    }]);

    app.controller('DashboardController', ['$http', function($http) {



    }]);

    app.run(function($rootScope, $location, dgAuthService){
        console.log('Authenticated: '+dgAuthService)

        $rootScope.$on('$routeChangeStart', function(next, current) { 
           console.log('$routeChangeStart', arguments);
        });

        /*$rootScope.$on('$locationChangeStart', function (event, next, current) {
            if (!dgAuthService.isAuthorized()) {
                console.log("Redirecting")
                $location.path('/login');
            }
        });*/

    })

})();