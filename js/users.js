/*
users controller
*/
(function () {
  angular.module('app')
    .controller('UsersCtrl', function ($scope, api) {
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

    });
})();
