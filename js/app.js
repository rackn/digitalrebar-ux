var host = 'https://192.168.131.235:3000';

(function(){
    var app = angular.module('app', ['ngRoute', 'ngMaterial', 'ngAnimate', 'sparkline', 'Devise']);

    app.config(function($routeProvider, AuthProvider, AuthInterceptProvider, $mdThemingProvider) {        
        
        AuthProvider.loginPath(host+'/api/session');
        AuthProvider.logoutPath(host+'/users/sign_out');

        AuthProvider.resourceName('')
        AuthInterceptProvider.interceptAuth(true);
        
        $mdThemingProvider.definePalette('customBlue', 
            $mdThemingProvider.extendPalette('blue', {
                'contrastDefaultColor': 'light',
                'contrastDarkColors': ['500'],
                '50': 'ffffff'
            })
        );

        $mdThemingProvider.theme('default')
            .primaryPalette('customBlue', {
                'default': '800',
                'hue-1': '50'
            })
            .accentPalette('red');
        
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

    app.controller('LoginCtrl', ['$rootScope', '$location', 'Auth', '$http', function($rootScope, $location, Auth, $http) {
        $rootScope.title = 'Login';

        console.log('login: ' + Auth._currentUser)
        this.credentials = {
            username: '',
            password: ''
        }

        var login = this;

        this.signIn = function() {
            Auth.login(login.credentials, {interceptAuth: true}).
                then(function(response) {
                    // success!
                }, function(error) {
                    alert('Error');
                })
            
        }

        $rootScope.logout = function() {
            if(!Auth.isAuthenticated())
                return;

            Auth.logout({interceptAuth: true}).then(function(oldUser) {
            }, function(error) {
                console.log("Error logging out")
            });
        }

    }]);

    app.controller('DashCtrl', ['$mdMedia', '$mdDialog', '$rootScope', '$http', function($mdMedia, $mdDialog, $rootScope, $http) {
        $rootScope.title = 'Dashboard';

        var dash = this;
        this.deployments = [];


        this.showNodeDialog = function(ev, node) {
            console.log(node);
            $rootScope.node = node;
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
            $mdDialog.show({
                controller: 'DialogController',
                controllerAs: 'ctrl',
                templateUrl: 'nodedialog.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals: {
                    node: $rootScope.node
                },
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
        };

        this.toggleExpand = function(deployment) {
            deployment.expand = !deployment.expand;
            if(deployment.expand) {
                $http.get('/example_deployment.json').
                    success(function(data){
                        deployment.data = data.deployment;
                        console.log("Update")
                    }).
                    error(function(){
                        console.log('No data!')
                    })
            }
        }

        this.opts = { // sparkline options
            sliceColors: [
                "#8BC34A", 
                "#F44336",
                "#03A9F4",
                "#616161"
            ],
            tooltipFormat: '{{value}}',
            disableTooltips: true,
            disableHighlight: true,
            borderWidth: 2,
            borderColor: '#fff',
            width: '2em',
            height: '2em',
        };

        $http.get('/example_dashboard.json').
            success(function(data){
                dash.deployments = data.deployments;
                for(var i in dash.deployments) {
                    dash.deployments[i].data = {}
                }
            }).
            error(function(){

            })


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
            $rootScope.user = currentUser.user;
        });

        $rootScope.tryFetch = function() {
            console.log("token: "+Auth._currentUser.token)
            $http({
                method: "GET",
                url: host+'/api/v2/nodes',
                headers: {
                    'Set-Cookie': '_session_id='+Auth._currentUser.token+';'
                }
            }).
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

    app.controller('DialogController', ['$scope', '$rootScope', '$mdDialog', 'locals', function ($scope, $rootScope, $mdDialog, locals) {
        $scope.locals = locals;
        $scope.icons = $rootScope.icons;

        $scope.hide = function() {
            $mdDialog.hide();
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.answer = function(answer) {
            $mdDialog.hide(answer);
        };
    }]);

})();
