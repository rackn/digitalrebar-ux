var version = '0.1.3';

(function(){
    var app = angular.module('app', [
        'ngRoute', 'ngMaterial', 'ngCookies', 'ngAnimate', 'sparkline',
        'LocalStorageModule', 'DigestAuthInterceptor', 'md.data.table',
        'debounce', 'jsontext']);

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

        $mdThemingProvider.alwaysWatchTheme(true);

        $routeProvider.
            when('/', {
                redirectTo: '/deployments'
            }).
            when('/deployments', {
                controller: 'DeploymentsCtrl',
                controllerAs: 'deployments',
                templateUrl: 'views/deployments.html'
            }).
            when('/deployments/:id', {
                controller: 'DeploymentsCtrl',
                controllerAs: 'deployments',
                templateUrl: 'views/deployments.html'
            }).
            when('/login', {
                controller: 'LoginCtrl',
                controllerAs: 'login',
                templateUrl: 'views/login.html'
            }).
            when('/nodes', {
                controller: 'NodesCtrl',
                controllerAs: 'nodes',
                templateUrl: 'views/nodes.html'
            }).
            when('/nodes/:id', {
                controller: 'NodesCtrl',
                controllerAs: 'nodes',
                templateUrl: 'views/nodes_singular.html'
            }).
            when('/node_roles', {
                controller: 'NodeRolesCtrl',
                controllerAs: 'node_roles',
                templateUrl: 'views/node_roles.html'
            }).
            when('/node_roles/:id', {
                controller: 'NodeRolesCtrl',
                controllerAs: 'node_roles',
                templateUrl: 'views/node_roles_singular.html'
            }).
            when('/roles', {
                controller: 'RolesCtrl',
                controllerAs: 'roles',
                templateUrl: 'views/roles.html'
            }).
            when('/roles/:id', {
                controller: 'RolesCtrl',
                controllerAs: 'roles',
                templateUrl: 'views/roles_singular.html'
            }).
            when('/barclamps', {
                controller: 'BarclampsCtrl',
                controllerAs: 'barclamps',
                templateUrl: 'views/barclamps.html'
            }).
            when('/barclamps/:id', {
                controller: 'BarclampsCtrl',
                controllerAs: 'barclamps',
                templateUrl: 'views/barclamps_singular.html'
            }).
            when('/network', {
                controller: 'NetworkCtrl',
                controllerAs: 'networks',
                templateUrl: 'views/network.html'
            }).
            when('/providers', {
                controller: 'ProviderCtrl',
                controllerAs: 'providers',
                templateUrl: 'views/provider.html'
            }).
            when('/providers/:id', {
                controller: 'ProviderCtrl',
                controllerAs: 'providers',
                templateUrl: 'views/provider.html'
            }).
            when('/annealer', {
                controller: 'AnnealerCtrl',
                controllerAs: 'annealer',
                templateUrl: 'views/annealer.html'
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

    app.directive('elastic', [
        '$timeout',
        function($timeout) {
            return {
                restrict: 'A',
                link: function($scope, element) {
                    $scope.initialHeight = $scope.initialHeight || element[0].style.height;
                    var resize = function() {
                        element[0].style.height = $scope.initialHeight;
                        element[0].style.height = "" + element[0].scrollHeight + "px";
                    };
                    element.on("input change", resize);
                    $timeout(resize, 0);
                }
            };
        }
    ]);

    app.controller('AppCtrl', function($scope, $location, localStorageService, $mdSidenav, api){
        $scope.toggleSideNav = function(menuId) {
            $mdSidenav(menuId).toggle();
        };

        $scope.reload = api.reload;

        $scope.menu = [
            {
                title: 'Deployments',
                icon: 'dashboard',
                path: '/deployments'
            },
            {
                title: 'Workloads',
                icon: 'work'
            },
            {
                title: 'Providers',
                icon: 'filter_drama',
                path: '/providers'
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

        $scope.setPath = function(path) {
            $location.path(path)
        }

        $scope.logout = function(){
            localStorageService.add('username', '')
            localStorageService.add('password', '')
            localStorageService.add('remember', '')
            window.location.reload();
        }

    });

    app.run(function($rootScope, $location, $http, $cookies, debounce, $interval, localStorageService, api){

        $rootScope.user;
        $rootScope.isAuth = function(){return !!$rootScope.user;};
        $rootScope.lastPath = '/'
        $rootScope.shouldLogOut = false;

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            var path = next.split('/#/')[1];
            if(path) // if it's a valid path
                path = path.toLowerCase();
            else // default to Deployments
                path = 'deployments'

            if(path !== 'login' && !$rootScope.isAuth()) {

                $rootScope.lastPath = '/'+path;
                $location.path('/login');
            }
            
            if(path === 'login' && $rootScope.isAuth()) {
                $location.path('/deployments')
            }
        });

        $rootScope.$on('login', function(event, data){ 
            $rootScope.user = data;
            $rootScope.shouldLogOut = localStorageService.get('remember');

            api('/api/v2/providers/templates').
                success(function(data){
                    $rootScope.providerTemplates = data
                    console.log(data)
                })
        })

        $rootScope.$on('host', function(event, data){ 
            $rootScope.host = data;
        })

        $rootScope.$on('title', function(event, data){ 
            $rootScope.title = data
        })

        window.onkeydown = function(e) {
            var key = e.keyCode ? e.keyCode : e.which;
            var ctrl = e.ctrlKey
            var alt = e.altKey
            var shift = e.shiftKey
            $rootScope.$evalAsync(function(){
                $rootScope.$broadcast("keyDown", {
                    key: key,
                    ctrl: ctrl,
                    alt: alt,
                    shift: shift
                })                
            })
        }

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


    });

})();
