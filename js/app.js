var version = '0.0.1';

(function(){
    var app = angular.module('app', [
        'ngRoute', 'ngMaterial', 'ngCookies', 'ngAnimate', 'sparkline',
        'LocalStorageModule', 'DigestAuthInterceptor', 'md.data.table']);

    app.config(function($httpProvider, $routeProvider, $mdThemingProvider) {        
        
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
            })

        $mdThemingProvider.theme('status_error').
            primaryPalette('red', {
                'default': '700'
            })

        $mdThemingProvider.theme('status_process').
            primaryPalette('yellow', {
                'default': '500'
            })

        $mdThemingProvider.theme('status_todo').
            primaryPalette('blue', {
                'default': '500'
            })

        $mdThemingProvider.theme('status_off').
            primaryPalette('grey', {
                'default': '900'
            })
        
        $mdThemingProvider.theme('status_queue').
            primaryPalette('yellow', {
                'default': '200'
            })

        $mdThemingProvider.theme('status_reserved').
            primaryPalette('purple', {
                'default': '500'
            })

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
            when('/node', {
                controller: 'NodeCtrl',
                controllerAs: 'nodes',
                templateUrl: 'node.html'
            }).
            when('/network', {
                controller: 'NetworkCtrl',
                controllerAs: 'networks',
                templateUrl: 'network.html'
            }).

            otherwise({
                redirectTo: '/login'
            })
    });
    
    // filter for determining if an object has an attribute
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
                icon: 'dns',
                path: '/node'
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

    app.run(function($rootScope, $location, $http, $cookies){

        // use regex to get the current location
        var currentLocation = /https:\/\/[^:]+/.exec(location.href)[0];
        $rootScope.host = $cookies.get('host') || currentLocation+':3000';

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
            args.url = $rootScope.host+path;
            return $http(args)
        }

        $rootScope.tryFetch = function() {
            $rootScope.callApi('/api/v2/providers').
                success(function(data){
                    console.log("Got data")
                    console.log(JSON.stringify(data));
                }).
                error(function(){
                    console.log('No data!')
                })
        }

        $rootScope._deployments = {}
        $rootScope._nodes = {}
        $rootScope._networks = {}
        $rootScope._providers = {}

        // api call for getting all the deployments
        $rootScope.getDeployments = function() {
            $rootScope.callApi('/api/v2/deployments').
                success(function(data){
                    $rootScope._deployments = {}
                    for(var i in data) {
                        var deployment = data[i]
                        var id = deployment.id
                        $rootScope._deployments[id] = deployment
                        $rootScope._deployments[id].nodes = {
                            'ready': 0,
                            'error': 0,
                            'working': 0,
                            'off': 0
                        }
                        $rootScope._deployments[id].data = {nodes: [], roles: [], networks: []}
                    }
                    $rootScope.getNodes();
                    $rootScope.getNetworks();

                }).error(function(resp){

                })
        }

        // api call for getting all the nodes
        $rootScope.getNodes = function() {
            $rootScope.callApi('/api/v2/nodes').
                success(function(data){
                    $rootScope._nodes = {};
                    for(var i in data) {
                        var node = data[i]


                        var id = node.id*1
                        // get the node's address from the api
                        $rootScope.callApi('/api/v2/nodes/'+node.id+'/attribs/node-control-address').
                            success(function(data){
                                $rootScope._nodes[data.node_id].address = data.value
                            })
                        $rootScope._nodes[id] = node

                        var state = 'ready'
                        if(!node.alive)
                            state = 'off'
                        node.status = state

                        var deployment = $rootScope._deployments[node.deployment_id]
                        if(node.deployment_id == deployment.id) {
                            deployment.data.nodes.push(node)
                            deployment.nodes[state] ++
                        }
                    }
                }).
                error(function(resp){

                })
        }

        // api call for getting all the deployment roles
        $rootScope.getDeploymentRoles = function() {
            $rootScope.callApi('/api/v2/deployment_roles').
                success(function(data){
                    for(var i in data) {
                        var role = data[i]

                        for(var j in $rootScope.deployments) {
                            var deployment = $rootScope.deployment[j]
                            if(node.deployment_id == deployment.id) {
                                deployment.data.roles.push(node)
                            }
                        }
                    }
                }).
                error(function(resp){

                })
        }

        // api call for getting all the providers
        $rootScope.getProviders = function() {
            $rootScope.callApi('/api/v2/providers').
                success(function(data){
                    $rootScope._providers = {}
                    for(var i in data) {
                        var provider = data[i]
                        var id = provider.id
                        $rootScope._providers[id] = provider
                    }
                }).error(function(resp){

                })
        }

        // api call for getting all the providers
        $rootScope.getNetworks = function() {
            $rootScope.callApi('/api/v2/networks').
                success(function(data){
                    $rootScope._networks = {}
                    for(var i in data) {
                        var network = data[i]
                        var id = network.id
                        $rootScope._networks[id] = network

                        var deployment = $rootScope._deployments[id]
                        if(network.deployment_id == deployment.id) {
                            deployment.data.networks.push(network)
                        }
                    }
                }).error(function(resp){

                })
        }

        // api call for getting all the node roles for a specified node
        $rootScope.getNodeRoles = function(id) {
            $rootScope.callApi('/api/v2/nodes/'+id+'/node_roles').
            success(function(data){

            }).
            error(function(resp){

            })
        }

    });

})();
