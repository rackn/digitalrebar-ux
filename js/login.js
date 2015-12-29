/*
login controller
*/
(function(){
    angular.module('app')
    .controller('LoginCtrl', ['$rootScope', '$location', 'Auth', '$http', function($rootScope, $location, Auth, $http) {
        $rootScope.title = 'Login'; // shows up on the top toolbar

        console.log('login: ' + Auth._currentUser)

        // model for the sign in form
        this.credentials = {
            username: '',
            password: ''
        }

        // to be referenced in the signIn function
        var login = this;

        // function for the login button
        this.signIn = function() {
            Auth.login(login.credentials, {interceptAuth: true}).
                then(function(response) {
                    // success!
                }, function(error) {
                    alert('Error');
                })
            
        }

        // function for ng-click='logout()'
        $rootScope.logout = function() {
            if(!Auth.isAuthenticated())
                return;

            Auth.logout({interceptAuth: true}).then(function(oldUser) {
            }, function(error) {
                console.log("Error logging out")
            });
        }

    }]);
})();