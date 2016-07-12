/*
tenants controller
*/
(function () {
  angular.module('app')
    .controller('TenantsCtrl', function ($scope, api, $mdDialog, $mdMedia, $routeParams) {
      $scope.$emit('title', 'Tenants'); // shows up on the top toolbar

      var tenants = this;

      $scope.hasTenants = -1;
      $scope.tenantList = [];
      $scope.expand = {};

      $scope.users = {};
      $scope.tenants = {};

      if ($routeParams.id)
        $scope.expand[$routeParams.id] = true;

      var inOrderMap = function (map, arr, depth) {
        if (typeof depth === 'undefined')
          depth = 0
        for (var i in map) {
          arr.push(map[i]);
          map[i].depth = depth;
          inOrderMap(map[i].children, arr, depth + 1);
        }
      };

      $scope.update = function () {

        api("/api/v2/tenants").
        success(function (tenants) {
          $scope.hasTenants = 1;
          for (var i in tenants) {
            $scope.tenants[tenants[i].id] = tenants[i];
            tenants[i].children = [];
            tenants[i].users = [];
          }
          var parents = [];
          for (var i in tenants) {
            var tenant = tenants[i];
            if (typeof tenant.parent_id === 'undefined' || !$scope.tenants[tenant.parent_id])
              parents.push(tenant)
            else {
              $scope.tenants[tenant.parent_id].children.push(tenant)
            }
          }

          var inOrder = [];
          inOrderMap(parents, inOrder);
          $scope.tenantList = inOrder;
          
           // get a list of users
          api("/api/v2/users").
          success(function (users) {
            for (var i in users) {
              var user = users[i];
              $scope.tenants[user.tenant_id].users.push(user)
              $scope.users[user.id] = user;
            }
          }).error(function () {
            api.toast("Error fetching users", "settings");
          });
        }).
        error(function () {
          api.toast("Error fetching tenants", "tenants");
          $scope.hasTenants = 0;
        });
      };

      $scope.update();

      $scope.deleteTenant = function (uuid) {
        $scope.confirm(event, {
          title: "Remove Tenant",
          message: "Are you sure you want to remove this tenant?",
          yesCallback: function () {
            api('/tenants/' + uuid, {
              method: 'DELETE'
            }).success(function (data) {
              $scope.update();
            }).error(function (err) {
              $scope.update();
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
            tenants: $scope.tenants,
            tenant: tenant || { UUID: "", Content: "" }
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        }).then(function () {
          $scope.update();
        }, function () {
          $scope.update();
        });
      }
    });
})();
