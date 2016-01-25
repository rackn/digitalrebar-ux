var version = '0.0.1';

(function(){
    var app = angular.module('app', [
        'ngRoute', 'ngMaterial', 'ngCookies', 'ngAnimate', 'sparkline',
        'LocalStorageModule', 'DigestAuthInterceptor', 'md.data.table', 'debounce']);

    app.config(function($httpProvider, $routeProvider, $mdThemingProvider, apiProvider) {        
        
        $httpProvider.interceptors.push('digestAuthInterceptor');

        $mdThemingProvider.theme('default')
            .primaryPalette('blue', {
                'default': '800',
                'hue-1': '50'
            })
            .accentPalette('red')
        
        $mdThemingProvider.theme('input', 'default')
            .primaryPalette('grey')


        // themes for different status colors
        $mdThemingProvider.theme('status_ready').
            primaryPalette('green', {
                'default': '800'
            }).accentPalette('grey', {'default': '900'})

        $mdThemingProvider.theme('status_error').
            primaryPalette('red', {
                'default': '700'
            }).accentPalette('grey', {'default': '900'})

        $mdThemingProvider.theme('status_process').
            primaryPalette('yellow', {
                'default': '600'
            }).accentPalette('grey', {'default': '900'})

        $mdThemingProvider.theme('status_todo').
            primaryPalette('yellow', {
                'default': '300'
            }).accentPalette('grey', {'default': '900'})

        $mdThemingProvider.theme('status_off').
            primaryPalette('grey', {
                'default': '900'
            }).accentPalette('grey', {'default': '900'})
        
        $mdThemingProvider.theme('status_queue').
            primaryPalette('yellow', {
                'default': '100'
            }).accentPalette('grey', {'default': '900'})

        $mdThemingProvider.theme('status_reserved').
            primaryPalette('blue', {
                'default': '500'
            }).accentPalette('grey', {'default': '900'})

        $routeProvider.
            when('/', {
                redirectTo: '/dash'
            }).
            when('/dash', {
                controller: 'DashCtrl',
                controllerAs: 'dash',
                templateUrl: 'dashboard.html'
            }).
            when('/login', {
                controller: 'LoginCtrl',
                controllerAs: 'login',
                templateUrl: 'login.html'
            }).
            when('/nodes', {
                controller: 'NodesCtrl',
                controllerAs: 'nodes',
                templateUrl: 'nodes.html'
            }).
            when('/nodes/:id', {
                controller: 'NodesCtrl',
                controllerAs: 'nodes',
                templateUrl: 'nodes_singular.html'
            }).
            when('/network', {
                controller: 'NetworkCtrl',
                controllerAs: 'networks',
                templateUrl: 'network.html'
            }).
            when('/providers', {
                controller: 'ProviderCtrl',
                controllerAs: 'providers',
                templateUrl: 'provider.html'
            }).
            when('/providers/:id', {
                controller: 'ProviderCtrl',
                controllerAs: 'providers',
                templateUrl: 'provider.html'
            }).
            when('/annealer', {
                controller: 'AnnealerCtrl',
                controllerAs: 'annealer',
                templateUrl: 'annealer.html'
            }).
            

            otherwise({
                redirectTo: '/login'
            })
    });
    
    // filter for determining if an object doesn't have an attribute
    // ng-repeat="obj in hash | not:'boolean_attr' "
    // ng-repeat will show anything with that attribute as a false value
    app.filter('not', function() {
        return function(items, field) {
            var result = {};
            angular.forEach(items, function(value, key) {
                if(!value[field])
                    result[key] = value;
            });
            return result;
        };
    });

    // filter for determining if an object has an attribute
    // ng-repeat="obj in hash | has:'boolean_attr' "
    // ng-repeat will show anything with that attribute as a true value
    app.filter('has', function() {
        return function(items, field) {
            var result = {};
            angular.forEach(items, function(value, key) {
                if(value[field])
                    result[key] = value;
            });
            return result;
        };
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
                title: 'Nodes',
                icon: 'dns',
                path: '/nodes'
            },
            {
                title: 'Networks',
                icon: 'swap_horiz',
                path: '/network'
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

        $rootScope.states = {
            '-1': 'error', //error
            '0': 'ready', //active
            '1': 'todo', //todo
            '2': 'process', //transition
            '3': 'queue', //blocked
            '4': 'reserved' //proposed
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

    app.run(function($rootScope, $location, $http, $cookies, debounce, $interval){

        $rootScope.user;
        $rootScope.isAuth = function(){return !!$rootScope.user;};
        
        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            var path = next ? next.split('/#/')[1].toLowerCase() : undefined;
            if(path !== 'login' && !$rootScope.isAuth()) {
                $location.path('/login');
            }
            
            if(path === 'login' && $rootScope.isAuth()) {
                $location.path('/dash')
            }
        });

        $rootScope.$on('login', function(event, data){ 
            $rootScope.user = data;
        })

        $rootScope.$on('host', function(event, data){ 
            $rootScope.host = data;
        })

        $rootScope.$on('title', function(event, data){ 
            $rootScope.title = data
        })


    });

})();
