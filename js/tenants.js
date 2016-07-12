/*
tenants controller
*/
(function () {
  angular.module('app')
    .controller('TenantsCtrl', function ($scope, api, $mdDialog, $mdMedia, $routeParams) {
      $scope.$emit('title', 'Tenants'); // shows up on the top toolbar

      var tenants = this;

      $scope.expand = {};

      if ($routeParams.id)
        $scope.expand[$routeParams.id] = true;

      $scope.deleteTenant = function (uuid) {
        $scope.confirm(event, {
          title: "Remove Tenant",
          message: "Are you sure you want to remove this tenant?",
          yesCallback: function () {
            api('/tenants/' + uuid, {
              method: 'DELETE'
            }).success(function (data) {
              api.getUsers();
            }).error(function (err) {
              api.getUsers();
              api.toast("Error deleting tenants - "+err.message, "tenants")
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
            tenants: $scope._tenants,
            tenant: tenant || { UUID: "", Content: "" }
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        }).then(function () {
          api.getUsers();
        }, function () {
          api.getUsers();
        });
      }
    });
})();
