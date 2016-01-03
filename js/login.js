/*
login controller
*/
(function(){
    angular.module('app')
    .controller('LoginCtrl', function($rootScope, $location, localStorageService, $http, $cookieStore) {
        $rootScope.title = 'Login'; // shows up on the top toolbar

        // model for the sign in form
        this.credentials = {
            username: '',
            password: ''
        }

        this.host = $rootScope.host;

        // to be referenced in the signIn function
        var login = this;

        // function for the login button
        this.signIn = function() {
            console.log('attempting to sign in')
            localStorageService.add('username', login.credentials.username);
            localStorageService.add('password', login.credentials.password);
            $rootScope.host = login.host

            $rootScope.callApi('/api/v2/digest', {
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
            $rootScope.callApi('/api/v2/digest', {method: 'GET'}).then(function(resp){
                $rootScope.user = resp.data; //store the user in rootScope so the isAuth function can use it!
                $location.path('/dash')
            }, function(err){})
        }

    });
})();