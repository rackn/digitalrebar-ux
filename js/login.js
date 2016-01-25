/*
login controller
*/
(function(){
    angular.module('app')
    .controller('LoginCtrl', function($scope, api, $location, localStorageService, $http, $cookies, debounce, $mdMedia, $mdDialog, $mdToast) {
        $scope.$emit('title', 'Login'); // shows up on the top toolbar

        // model for the sign in form
        this.credentials = {
            username: $cookies.get('username') || '',
            password: ''
        }

        this.host = $scope.host;

        // to be referenced in the signIn function
        var login = this;


        // attempt to get the eula from the host
        this.testHost = function(host) {
            if(!host) {
                login.state = -1 // error state
                return;
            }
            $scope.$emit('host', host)
            api('/api/license').success(function(data){
                login.state = 1 // valid state
                $scope.eula = data.eula
                $cookies.put('host', login.host)
                $scope.$emit('host', host)
            }).error(function(){
                login.state = -1 // error state
            })
        }
        
        this.showEulaDialog = function(ev, node) {
            $scope.node = node;
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: 'DialogController',
                controllerAs: 'ctrl',
                templateUrl: 'euladialog.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals: {
                    host: $scope.host,
                    eula: $scope.eula
                },
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
        };

        // make the loading icon appear immediately
        $scope.$watch('login.host', function(){
            login.state = 0 // loading state
            $scope.eula = undefined
        })

        // wait half a second to test if the host is valid
        $scope.$watch('login.host', debounce(login.testHost, 1000))


        // function for the login button
        this.signIn = function() {
            console.log('attempting to sign in')
            localStorageService.add('username', login.credentials.username);
            localStorageService.add('password', login.credentials.password);
            $cookies.put('username', login.credentials.username)

            api('/api/v2/digest', {
                method: 'HEAD',
                headers: {
                    'Content-Type': 'application/json'
                },
                params: {
                    'rackn': 'ux v'+version // let the logs know it's the ux
                }
            }).then(function (response) {
                login.getUser();
            }, function (response) {
                console.log('error', response);
                $mdToast.show(
                  $mdToast.simple()
                    .textContent(response.status + " - " + response.statusText)
                    .position('top left')
                    .hideDelay(3000)
                );
            });
        }

        this.getUser = function() { // once we get a 200 success from signIn, we can get the user
            api('/api/v2/digest', {method: 'GET'}).then(function(resp){
                $scope.$emit('login', resp.data); //store the user in rootScope so the isAuth function can use it!
                $scope.$emit('startUpdating') // start auto-updating the api data
                $location.path($scope.lastPath)
            }, function(err){})
        }

    });
})();