/*
users controller
*/
(function () {
  angular.module('app')
    .controller('UsersCtrl', function ($scope, api, $mdMedia, $mdDialog, $routeParams) {
      $scope.$emit('title', 'Users'); // shows up on the top toolbar

      var users = this;

      $scope.hasUsers = -1;
      $scope.userList = [];
      $scope.expand = {};

      $scope.users = {};
      $scope.tenants = {};
      $scope.capabilities = {};

      if ($routeParams.id)
        $scope.expand[$routeParams.id] = true;


      $scope.update = function () {
        // get a list of users
        api("/api/v2/users").
        success(function (users) {
          $scope.hasUsers = 1;
          $scope.userList = users;
          for (var i in users) {
            users[i].caps = {};
            $scope.users[users[i].id] = users[i];
          }

          // get capabilities for all users after getting users
          api("/api/v2/user_tenant_capabilities").
          success(function (caps) {
            for (var i in caps) {
              var cap = caps[i];
              if (!$scope.users[cap.user_id].caps[cap.tenant_id]) {
                $scope.users[cap.user_id].caps[cap.tenant_id] = {
                  id: cap.tenant_id,
                  caps: []
                };
              }
              $scope.users[cap.user_id].caps[cap.tenant_id].caps.push(cap.capability_id);
            }

          }).
          error(function () {
            api.toast("Error fetching capabilities", "settings");
          });
        }).
        error(function () {
          api.toast("Error fetching users", "settings");
          $scope.hasUsers = 0;
        });

        // get a list of tenants
        api("/api/v2/tenants").
        success(function (arr) {
          var tenants = {};
          for (var i in arr)
            tenants[arr[i].id] = arr[i];
          $scope.tenants = tenants;
        }).
        error(function () {
          api.toast("Error fetching tenants", "settings");
        });

        // get a list of capabilities
        api("/api/v2/capabilities").
        success(function (arr) {
          var capabilities = {};
          for (var i in arr)
            capabilities[arr[i].id] = arr[i];
          $scope.capabilities = capabilities;
        }).
        error(function () {
          api.toast("Error fetching capabilities", "settings");
        });
      };

      $scope.update();

      $scope.deleteUser = function (uuid) {
        $scope.confirm(event, {
          title: "Remove User",
          message: "Are you sure you want to remove this user?",
          yesCallback: function () {
            api('/users/' + uuid, {
              method: 'DELETE'
            }).success(function (data) {
              api.getHealth();
            }).error(function () {
              api.getHealth();
            });
          }
        });
      };

      $scope.createUserPrompt = function (ev, temp) {
        var user = angular.copy(temp);
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/adduserdialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            editing: (typeof user !== 'undefined'),
            user: user || { UUID: "", Content: "" }
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        })
      }

    });
})();
