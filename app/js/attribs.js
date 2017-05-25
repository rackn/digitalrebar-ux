require("js/app.js");
/*
attribs controller
*/
(function () {
  angular.module('app').controller('AttribsCtrl', function ($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog, $timeout, api) {

    $scope.$emit('title', 'Attributes'); // shows up on the top toolbar

    $scope.hasAttrib = -1;
    $scope.attribs = [];
    $scope.editing = false;

    if ($scope.hasAttrib == -1) {
      api('/api/v2/attribs').
      success(function (obj) {
        $scope.attribs = obj;
        $scope.hasAttrib = 1;
      }).
      error(function () {
        $scope.hasAttrib = 0;
      });
    }
  });

})();
