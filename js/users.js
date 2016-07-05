/*
users controller
*/
(function () {
  angular.module('app')
    .controller('UsersCtrl', function ($scope, api, $mdMedia, $mdDialog) {
      $scope.$emit('title', 'Users'); // shows up on the top toolbar

      var users = this;

      $scope.hasUsers = -1;
      $scope.userList = [];

      api("/api/v2/users").
      success(function (users) {
        $scope.hasUsers = 1;
        $scope.userList = users;
      }).
      error(function () {
        api.toast("Error fetching users", "settings");
        $scope.hasUsers = 0;
      });

      $scope.deleteUser = function (uuid) {
        $scope.confirm(event, {
          title: "Remove User",
          message: "Are you sure you want to remove this user?",
          yesCallback: function () {
            api('/users/' + uuid, {
              method: 'DELETE'
            }).success(function (data) {
              api.getHealth();
            }).error(function () {
              api.getHealth();
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
        })
      }

    });
})();
