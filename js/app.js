var host = 'https://rack1:3000';
//3hr

(function(){
    var app = angular.module('app', ['ngRoute', 'ngMaterial', 'ngAnimate', 'sparkline', 'Devise', 'ngCookies']);

    app.config(function($routeProvider, AuthProvider, AuthInterceptProvider, $mdThemingProvider) {        
        
        AuthProvider.loginPath(host+'/api/session');
        AuthProvider.logoutPath(host+'/users/sign_out');

        AuthProvider.resourceName('')
        AuthInterceptProvider.interceptAuth(true);

        $mdThemingProvider.theme('default')
            .primaryPalette('blue', {
                'default': '800',
                'hue-1': '50'
            })
            .accentPalette('red')
        
        $mdThemingProvider.theme('input', 'default')
            .primaryPalette('grey')

        $routeProvider.
            when('/', {
                redirectTo: '/dash'
            }).
            when('/dash', {
                controller: 'DashCtrl',
                controllerAs: 'dash',
                templateUrl: 'dashboard.html',
            }).
            when('/login', {
                controller: 'LoginCtrl',
                controllerAs: 'login',
                templateUrl: 'login.html',
            }).
            otherwise({
                redirectTo: '/login'
            })
    });

    app.controller('AppCtrl', ['$scope', '$rootScope', '$mdSidenav', function($scope, $rootScope, $mdSidenav){
        $scope.toggleSideNav = function(menuId) {
            $mdSidenav(menuId).toggle();
        };

        $scope.menu = [
            {
                title: 'Dashboard',
                icon: 'dashboard',
                path: '/dash'
            },
            {
                title: 'Workloads',
                icon: 'work'
            },
            {
                title: 'Deployments',
                icon: 'view_column'
            },
            {
                title: 'Node',
                icon: 'dns'
            },
            {
                title: 'Networks',
                icon: 'swap_horiz'
            },
        ];

        $rootScope.icons = {
            'ready': 'check_circle',
            'error': 'warning',
            'process': 'autorenew',
            'todo': 'play_circle_outline',
            'off': 'power_settings_new',
            'queue': 'update',
            'reserved': 'pause_circle_outline',
        }

        $scope.admin = [
            {
                title: 'Settings',
                icon: 'settings'
            },
            {
                title: 'Users',
                icon: 'supervisor_account'
            },
        ];

    }]);

    app.run(function($rootScope, $location, $http, Auth){
        console.log('Authenticated: '+Auth.isAuthenticated())

        $rootScope.isAuth = Auth.isAuthenticated

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            if (!Auth.isAuthenticated()) {
                $location.path('/login');
            }
        });

        $rootScope.$on('devise:login', function(event, currentUser) {
            $location.path('/dash');
            $rootScope.user = currentUser;
        });

        // function for calling api functions ( eg. /api/v2/nodes )
        // to use:
        // $rootScope.callApi('/path/to/api', {data: {asdf}, method: 'GET'}).success(function(data){}).error(function(data){})
        $rootScope.callApi = function(path, args) {
            args = args || {};
            args.method = args.method || 'GET';
            args.headers = args.headers || {}
            args.url = host+path;
            return $http(args)
        }

        $rootScope.tryFetch = function() {
            $rootScope.callApi('/api/v2/nodes').
                success(function(data){
                    console.log("Got data")
                    console.log(data);
                }).
                error(function(){
                    console.log('No data!')
                })
        }

        $rootScope.$on('devise:logout', function(event, oldCurrentUser) {
            $location.path('/login');
        });

    });

})();
