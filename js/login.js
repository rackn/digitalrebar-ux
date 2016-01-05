/*
login controller
*/
(function(){
    angular.module('app')
    .controller('LoginCtrl', function($scope, $location, localStorageService, $http, $cookies) {
        $scope.$emit('title', 'Login'); // shows up on the top toolbar

        // model for the sign in form
        this.credentials = {
            username: $cookies.get('username') || '',
            password: ''
        }

        this.host = $scope.host;

        // to be referenced in the signIn function
        var login = this;

        // function for the login button
        this.signIn = function() {
            console.log('attempting to sign in')
            localStorageService.add('username', login.credentials.username);
            localStorageService.add('password', login.credentials.password);
            $scope.host = login.host
            $cookies.put('host', login.host)
            $cookies.put('username', login.credentials.username)

            $scope.callApi('/api/v2/digest', {
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
            });
        }

        this.getUser = function() { // once we get a 200 success from signIn, we can get the user
            $scope.callApi('/api/v2/digest', {method: 'GET'}).then(function(resp){
                $scope.$emit('login', resp.data); //store the user in rootScope so the isAuth function can use it!
                $scope.$emit('startUpdating') // start auto-updating the api data
                $location.path('/dash')
            }, function(err){})
        }

    });
})();