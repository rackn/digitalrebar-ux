/*
login controller
*/
(function () {
  angular.module('app')
    .controller('LoginCtrl', function ($scope, api, $location, localStorageService, $http, $cookies, debounce, $mdMedia, $mdDialog, $mdToast) {
      $scope.$emit('title', 'Login'); // shows up on the top toolbar

      // model for the sign in form
      this.credentials = {
        username: localStorageService.get('username') || '',
        password: localStorageService.get('password') || '',
      };

      $scope.acceptedEula = localStorageService.get('accept_eula') || false;

      $scope.acceptEula = function (ev) {
        if($scope.acceptedEula) {
          localStorageService.add('accept_eula', false);
          $scope.acceptedEula = false;
        } else {        
          $mdDialog.show({
            controller: 'LoginCtrl',
            templateUrl: 'views/dialogs/accepteuladialog.tmpl.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false
          }).then(function(accepted){
            localStorageService.add('accept_eula', accepted);
            $scope.acceptedEula = localStorageService.get('accept_eula');
          }, function(){

          });
        }
      };

      $scope.answerEula = function (val) {
        $mdDialog.hide(val);
      };

      this.hosts = localStorageService.get('hosts') || [];

      this.host = $scope.host;
      var params = $location.search();

      if (params.host)
        this.host = params.host;

      // to be referenced in the signIn function
      var login = this;


      // attempt to get the eula from the host
      this.testHost = function (host) {
        if (!host) {
          login.state = -1; // error state
          return;
        }
        $scope.$emit('host', host);
        api('/api/license').success(function (data) {
          login.state = 1; // valid state
          $scope.eula = data.eula;
          $cookies.put('host', login.host);
          $scope.$emit('host', host);
          var hosts = localStorageService.get('hosts') || [];
          if (hosts.indexOf(host) < 0) {
            login.hosts = hosts.concat(host);
            localStorageService.add('hosts', login.hosts);
          }

          var token = $cookies.get('DrAuthToken');
          if (typeof token !== 'undefined') {
            var success = false;
            api('/api/v2/users/').success(function () {
              var username = $cookies.get('DrAuthUser');
              localStorageService.add('username', username);
              $scope.$emit('login', { username: username }); //store the user in rootScope so the isAuth function can use it!
              $scope.$emit('startUpdating'); // start auto-updating the api data
              $location.path($scope.lastPath);
              success = true;
            }).error(function () {
              $cookies.remove('DrAuthUser');
              $cookies.remove('DrAuthToken');
              $cookies.remove('_rebar_session');
            });
            if (success)
              return;
          }

          else if(login.credentials.username && login.credentials.password)
            login.signIn();
        }).error(function () {
          login.state = -1; // error state
        });
      };

      this.showEulaDialog = function (ev, node) {
        $scope.node = node;
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/euladialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            host: $scope.host,
            eula: $scope.eula
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        });
      };

      // make the loading icon appear immediately
      $scope.$watch('login.host', function () {
        $scope.delayTest();
      });

      $scope.delayTest = function () {
        login.state = 0;
        $scope.eula = undefined;
        login.testHost(login.host);
      };

      // function for the login button
      this.signIn = function () {
        if(!$scope.acceptedEula) {
          api.toast("Please Accept the Eula")
          return;
        }
        console.log('attempting to sign in')
        localStorageService.add('username', login.credentials.username);
        localStorageService.add('password', login.credentials.password);

        api('/api/v2/digest', {
          method: 'HEAD',
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            'rackn': 'ux v' + version // let the logs know it's the ux
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
      };

      this.getUser = function () { // once we get a 200 success from signIn, we can get the user
        api('/api/v2/digest', { method: 'GET' }).then(function (resp) {
          $scope.$emit('login', resp.data); //store the user in rootScope so the isAuth function can use it!
          $scope.$emit('startUpdating'); // start auto-updating the api data

          $location.path($scope.lastPath);
        }, function (err) {
        });
      };

    });
})();
