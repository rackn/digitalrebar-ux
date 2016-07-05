/*
tenants controller
*/
(function () {
  angular.module('app')
    .controller('TenantsCtrl', function ($scope, api, $mdDialog, $mdMedia) {
      $scope.$emit('title', 'Tenants'); // shows up on the top toolbar

      var tenants = this;

      $scope.hasTenants = -1;
      $scope.tenantList = [];

      api("/api/v2/tenants").
      success(function (tenants) {
        $scope.hasTenants = 1;
        $scope.tenantList = tenants;
      }).
      error(function () {
        api.toast("Error fetching tenants", "tenants");
        $scope.hasTenants = 0;
      });

      $scope.deleteTenant = function (uuid) {
        $scope.confirm(event, {
          title: "Remove Tenant",
          message: "Are you sure you want to remove this tenant?",
          yesCallback: function () {
            api('/tenants/' + uuid, {
              method: 'DELETE'
            }).success(function (data) {
              api.getHealth();
            }).error(function () {
              api.getHealth();
            });
          }
        });
      };

      $scope.createTenantPrompt = function (ev, temp) {
        var tenant = angular.copy(temp);
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/addtenantdialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            editing: (typeof tenant !== 'undefined'),
            tenant: tenant || { UUID: "", Content: "" }
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        })
      }
    });
})();
