var host = 'https://192.168.1.233:3000';
var version = '0.0.1';
//3hr

(function(){
    var app = angular.module('app', ['ngRoute', 'ngMaterial', 'ngAnimate', 'sparkline', 'LocalStorageModule', 'DigestAuthInterceptor', 'ngCookies']);

    app.config(function($httpProvider, $routeProvider, $mdThemingProvider) {        
        
        $httpProvider.interceptors.push('digestAuthInterceptor');

        var digestConfig = {
            login: {
                method: 'HEAD',
                auth: true,
                url: host+'/api/v2/digest?rackn=client'
            },
            logout: {
                method: 'DELETE',
                auth: true,
                url: host+'/api/v2/digest'
            }
        }

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

    app.run(function($rootScope, $location, $http){

        $rootScope.user;
        $rootScope.isAuth = function(){return !!$rootScope.user;};

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            if (!$rootScope.isAuth()) {
                $location.path('/login');
            }
        });

        // function for calling api functions ( eg. /api/v2/nodes )
        // to use:
        // $rootScope.callApi('/path/to/api', {data: {asdf}, method: 'GET'}).success(function(data){}).error(function(data){})
        $rootScope.callApi = function(path, args) {
            args = args || {};
            args.method = args.method || 'GET';
            args.headers = args.headers || {}
            args.api = true;
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

    });

})();
