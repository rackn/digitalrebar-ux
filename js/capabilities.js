/*
capabilities controller
*/
(function () {
  angular.module('app')
    .controller('CapabilitiesCtrl', function ($scope, api, $mdMedia, $mdDialog, $routeParams) {
      $scope.$emit('title', 'Capabilities'); // shows up on the top toolbar

  });
    
})();
