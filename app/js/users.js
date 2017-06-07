/*
  Copyright 2017, RackN
  Users Controller
*/
(function () {
  angular.module('app')
  .controller('UsersCtrl', [
    '$scope', 'api', '$mdMedia', '$mdDialog', '$routeParams',
    function ($scope, api, $mdMedia, $mdDialog, $routeParams) {
      $scope.$emit('title', 'Users'); // shows up on the top toolbar

      $scope.expand = {};

      if ($routeParams.id)
        $scope.expand[$routeParams.id] = true;

      $scope.getUserList = function () {
        let list = [];
        for (let i in $scope._users) {
          list.push($scope._users[i]);
        }
        return list;
      };

      $scope.deleteUser = function (uuid) {
        $scope.confirm(event, {
          title: 'Remove User',
          message: 'Are you sure you want to remove this user?',
          yesCallback: function () {
            api('/api/v2/users/' + uuid, {
              method: 'DELETE'
            }).then(api.getUsers, api.getUsers);
          }
        });
      };

      $scope.createUserPrompt = function (ev, temp) {
        let user = angular.copy(temp);
        let useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/adduserdialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            editing: (typeof user !== 'undefined'),
            user: user || { UUID: '', Content: '' },
            tenants: $scope._tenants
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        }).then(api.getUsers, api.getUsers);
      };

      $scope.editCapsPrompt = function (ev, temp) {
        let user = angular.copy(temp);
        let useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        let caps = [];
        for (let id in $scope._capabilities) {
          caps.push($scope._capabilities[id]);
        }

        for(let tenant_id in $scope._tenants) {
          if(typeof user.caps[tenant_id] === 'undefined')
            user.caps[tenant_id] = {
              id: tenant_id,
              caps: []
            };
        }
        let original = angular.copy(user);

        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/editcapabilitiesdialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            user: user,
            update: api.getUsers,
            original: original,
            tenants: $scope._tenantsInOrder,
            capabilitiesList: caps,
            capabilities: $scope._capabilities
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        }).then(api.getUsers);
      };

    }
  ]);
})();
