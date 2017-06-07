/*
  Copyright 2017, RackN
  Attribs Controller
*/
(function () {
  angular.module('app').controller('AttribsCtrl', [
    '$scope', '$location', 'debounce', '$routeParams', '$mdMedia', '$mdDialog',
    '$timeout', 'api',
    function ($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog,
      $timeout, api) {
      $scope.$emit('title', 'Attributes'); // shows up on the top toolbar

      $scope.hasAttrib = -1;
      $scope.attribs = [];
      $scope.editing = false;

      if ($scope.hasAttrib == -1) {
        api('/api/v2/attribs').
        then(function (resp) {
          $scope.attribs = resp.data;
          $scope.hasAttrib = 1;
        }, function () {
          $scope.hasAttrib = 0;
        });
      }
    }
  ]);
)();
