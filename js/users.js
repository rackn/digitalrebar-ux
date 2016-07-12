/*
users controller
*/
(function () {
  angular.module('app')
    .controller('UsersCtrl', function ($scope, api, $mdMedia, $mdDialog, $routeParams) {
      $scope.$emit('title', 'Users'); // shows up on the top toolbar

      var users = this;
      $scope.expand = {};

      if ($routeParams.id)
        $scope.expand[$routeParams.id] = true;

      $scope.getUserList = function () {
        var list = [];
        for (var i in $scope._users) {
          list.push($scope._users[i]);
        }
        return list;
      }

      $scope.deleteUser = function (uuid) {
        $scope.confirm(event, {
          title: "Remove User",
          message: "Are you sure you want to remove this user?",
          yesCallback: function () {
            api('/users/' + uuid, {
              method: 'DELETE'
            }).success(function (data) {
              api.getUsers();
            }).error(function () {
              api.getUsers();
            });
          }
        });
      };

      $scope.createUserPrompt = function (ev, temp) {
        var user = angular.copy(temp);
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/adduserdialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            editing: (typeof user !== 'undefined'),
            user: user || { UUID: "", Content: "" }
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        }).then(function () {
          api.getUsers();
        }, function () {
          api.getUsers();
        });
      };

    });
})();
