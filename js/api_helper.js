/*
api helper controller
*/
(function () {
  angular.module('app')
    .controller('ApiHelperCtrl', function ($scope, api) {
      $scope.$emit('title', 'API Helper'); // shows up on the top toolbar

      $scope.method = 'get';
      $scope.payload = '{}';
      $scope.route = '';
      $scope.class = {};

      $scope.parse = function (data) {
        try {
          var a = JSON.parse(data);
          return a;
        } catch (e) {
          return false;
        }
      };

      $scope.testApi = function () {
        api($scope.route, {method: $scope.method, data: JSON.parse($scope.payload)}).
        success(function (data) {
          $scope.class = {success: true};
          $scope.output = JSON.stringify(data, null, "  ");
        }).error(function (err) {
          $scope.class = {error: true};
          $scope.output = JSON.stringify(err, null, "  ") || err;
        });
      };

      $scope.clearOutput = function () {
        $scope.output = "";
        $scope.class = {};
      }
    });
})();
