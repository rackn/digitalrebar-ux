var host = 'https://192.168.131.235:3000';
//3hr

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
                    'Cookie': '_session_id='+Auth._currentUser.token+';'
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
