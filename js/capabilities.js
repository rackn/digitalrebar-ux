/*
capabilities controller
*/
(function () {
  angular.module('app')
    .controller('CapabilitiesCtrl', function ($scope, api) {
      $scope.$emit('title', 'Capabilities'); // shows up on the top toolbar

      var capabilities = this;

      $scope.hasCapabilities = -1;
      $scope.capabilityList = [];

      api("/api/v2/capabilities").
      success(function (capabilities) {
        $scope.hasCapabilities = 1;
        $scope.capabilityList = capabilities;
      }).
      error(function () {
        api.toast("Error fetching capabilities", "capabilities");
        $scope.hasCapabilities = 0;
      });

    });
})();
