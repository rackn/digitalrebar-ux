/*
rule engine controller
*/
(function () {
  angular.module('app')
    .controller('EngineCtrl', function ($scope, api, $mdDialog, $mdMedia) {
      $scope.$emit('title', 'Rule Engine'); // shows up on the top toolbar
  });
})();
