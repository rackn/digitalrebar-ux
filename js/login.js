/*
login controller
*/
(function(){
    angular.module('app')
    .controller('LoginCtrl', function($rootScope, $location, dgAuthService, $http, $cookieStore) {
        $rootScope.title = 'Login'; // shows up on the top toolbar
        console.log('login: ' + dgAuthService)

        // model for the sign in form
        this.credentials = {
            username: 'rebar',
            password: 'rebar1'
        }

        // to be referenced in the signIn function
        var login = this;

        // function for the login button
        this.signIn = function() {
            /*Auth.login(login.credentials, {interceptAuth: true}).
                then(function(response) {
                    // success!
                    console.log(response)
                    //$cookieStore.put()
                }, function(error) {
                    alert('Error');
                })
            */
            /*$rootScope.callApi('/api/session', {
                method: "POST",
                params: login.credentials,
                withCredentials: true,
                useXDomain: true,
                
            }).success(function(data, status, headers, config) {
                console.log("Yes")
                console.log(data)
                console.log("Cookie: "+headers("Set-Cookie"))
                console.log(headers())
            }).error(function(a) {
                console.log("Error")
            })*/
            console.log('attempting to sign in')
            dgAuthService.start();
            dgAuthService.setCredentials(login.credentials.username, login.credentials.password);

            dgAuthService.signin()
        }

        this.signIn();

        // function for ng-click='logout()'
        $rootScope.logout = function() {
            //if(!Auth.isAuthenticated())
                return;

           // Auth.logout({interceptAuth: true}).then(function(oldUser) {
            //}, function(error) {
            //    console.log("Error logging out")
            //});
        }

    });
})();