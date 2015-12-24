(function(){
    var app = angular.module('app', ['ngRoute', 'Devise']);
        console.log('start')

    app.config(function($routeProvider, AuthProvider) {
        console.log("Config")
        

        AuthProvider.loginPath('https://rack1:3000/my/users/sign_in');
        AuthProvider.loginMethod('GET');
        AuthProvider.resourceName('Rebar');
        

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

    app.controller('LoginController', ['$scope', 'Auth', '$http', function($scope, Auth, $http) {
        console.log('login: ' + Auth._currentUser)
        this.credentials = {
            user: {
                username: 'user',
                password: 'pass'
            }
        }

        this.signIn = function(credentials) {
            var config = {
                interceptAuth: true
            };

            Auth.login(credentials, config).then(function() {
                alert("Yes!!")
            }).then(function(response) {
                alert(response);
            }, function(error) {
                alert('error');
            });
        }

    }]);

    app.controller('DashboardController', ['$http', function($http) {
        console.log('dash: ' + Auth._currentUser)



    }]);

    app.run(function($rootScope, $location, Auth){
        console.log('Authenticated: '+Auth.isAuthenticated())

        $rootScope.$on('$routeChangeStart', function(next, current) { 
           console.log('$routeChangeStart', arguments);
        });

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            var loggedIn = Auth._currentUser;
            if (!Auth.isAuthenticated()) {
                console.log("Redirecting")
                $location.path('/login');
            }
        });

    })

})();