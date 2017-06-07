/*
  Copyright 2017, RackN
  Login Controller
*/
(function () {
  angular.module('app')
  .controller('LoginCtrl', [
    '$scope', 'api', '$location', 'localStorageService', '$http', '$cookies',
    'debounce', '$mdMedia', '$mdDialog', '$mdToast',
    function ($scope, api, $location, localStorageService, $http, $cookies,
      debounce, $mdMedia, $mdDialog, $mdToast) {
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
          }).then(function(res){
            localStorageService.add('accept_eula', res);
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
      let params = $location.search();

      if (params.host)
        this.host = params.host;

      // to be referenced in the signIn function
      let login = this;


      // attempt to get the eula from the host
      this.testHost = function (host) {
        if (!host) {
          login.state = -1; // error state
          return;
        }
        $scope.$emit('host', host);
        api('/api/license').then(function (resp) {
          let data = resp.data;
          login.state = 1; // valid state
          $scope.eula = data.eula;
          $cookies.put('host', login.host);
          $scope.$emit('host', host);
          let hosts = localStorageService.get('hosts') || [];
          if (hosts.indexOf(host) < 0) {
            login.hosts = hosts.concat(host);
            localStorageService.add('hosts', login.hosts);
          }

          let token = $cookies.get('DrAuthToken');
          if (typeof token !== 'undefined') {
            api('/api/v2/users/').then(function () {
              let username = $cookies.get('DrAuthUser');
              localStorageService.add('username', username);
              //store the user in rootScope so the isAuth function can use it!
              $scope.$emit('login', { username: username });
              $scope.$emit('startUpdating'); // start auto-updating the api data
              $location.path($scope.lastPath);
            }, function () {
              $cookies.remove('DrAuthUser');
              $cookies.remove('DrAuthToken');
              $cookies.remove('_rebar_session');
            });
          } else if(localStorageService.get('username') &&
              localStorageService.get('password'))
            login.signIn();
        }, function () {
          login.state = -1; // error state
        });
      };

      this.showEulaDialog = function (ev, node) {
        $scope.node = node;
        let useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
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


      $scope.delayTest = function () {
        login.state = 0;
        $scope.eula = undefined;
        login.testHost(login.host);
      };

      // make the loading icon appear immediately
      let deregister = $scope.$watchCollection('login.host', $scope.delayTest);
      $scope.$on('$destroy', deregister);

      // function for the login button
      this.signIn = function () {
        if(!$scope.acceptedEula) {
          api.toast('Please Accept the Eula');
          return;
        }

        console.log('attempting to sign in');
        localStorageService.add('username', login.credentials.username);
        localStorageService.add('password', login.credentials.password);

        api('/api/v2/digest', {
          method: 'HEAD',
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            'rackn': 'ux v' + window.version // let the logs know it's the ux
          }
        }).then(function () {
          login.getUser();
        }, function (response) {
          console.log('error', response);
          $mdToast.show(
            $mdToast.simple()
            .textContent(response.status + ' - ' + response.statusText)
            .position('top left')
            .hideDelay(3000)
          );
        });
      };

      // once we get a 200 success from signIn, we can get the user
      this.getUser = function () {
        api('/api/v2/digest', { method: 'GET' }).then(function (resp) {
          //store the user in rootScope so the isAuth function can use it!
          $scope.$emit('login', resp.data);

          // start auto-updating the api data
          $scope.$emit('startUpdating');

          $location.path($scope.lastPath);
        });
      };
    }
  ]);
})();
