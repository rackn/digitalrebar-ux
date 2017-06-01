/*
provider controller
*/
(function () {
  angular.module('app')
    .controller('ProviderCtrl', function ($scope, $location, $routeParams, api, $mdMedia, $mdDialog) {
      $scope.$emit('title', 'Provider'); // shows up on the top toolbar

      this.getProviders = function () {
        var providers = [];
        for (var id in $scope._providers) {
          providers.push($scope._providers[id]);
        }
        return providers;
      };

      $scope.$on("keyDown", function (action, e) {
        if (e.key == 13) { // enter
          $scope.startEditing();
        }
        if (e.key == 27) { // escape
          $scope.stopEditing();
        }
      });

      $scope.deleteProvider = function(provider) {
        $scope.confirm(event, {
          title: "Delete Provider",
          message: "Are you sure you want to delete " + provider.name + " Provider?",
          yesCallback: function () {
            api('/api/v2/providers/' + provider.id, {
              method: 'DELETE'
            }).error(function (err) {
              api.toast('Error Deleted Provider', 'capability', err);
            }).success(function () {
              $scope._providers[provider.id].name = "DELETED-" + $scope._providers[provider.id].name
              api.toast('Deleted ' + provider.name + ' capability');
              api.getHealth();
              $location.path('/providers');
            })
          }
        });
      };

      $scope.saveProvider = function () {
        if (!$scope.editing)
          return;

        var data = angular.copy($scope.provider);
        api("/api/v2/providers/" + $scope.id, {
          method: "PUT",
          data: data
        }).
        success(api.addProvider).
        error(function (e) {
          api.toast("Couldn't Save Provider", 'provider', e);
        });
        $scope.stopEditing();
      };

      $scope.stopEditing = function () {
        if (!$scope.editing)
          return;

        $scope.provider = $scope._providers[$scope.id];
        $scope.editing = false;
      };

      $scope.startEditing = function () {
        if ($scope.editing)
          return;

        $scope.editing = true;
        $scope.provider = angular.copy($scope._providers[$scope.id]);
      };

      $scope.getNodes = function () {
        var nodes = [];
        for (var id in $scope._nodes) {
          if ($scope._nodes[id].provider_id == $scope.provider.id) {
            nodes.push($scope._nodes[id]);
          }
        }
        return nodes;
      };

      $scope.showAddProviderDialog = function (ev, type) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        var data = {
          name: type.toLowerCase(),
          description: "Not Set",
          type: type,
          auth_details: {}
        };
        for (var key in $scope.providerTemplates[type]) {
          var val = $scope.providerTemplates[type][key];
          data.auth_details[key] = val.default;
        }

        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/addproviderdialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            providerTemplates: $scope.providerTemplates,
            provider: data,
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        });
      };

      $scope.showAddNodeDialog = function (ev) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/addnodedialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            base_name: 'digital-rebar-node',
            _providers: $scope._providers,
            provider: $scope.provider.name,
            add_os: 'default_os',
            number: 1,
            _deployments: $scope._deployments
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        });
      };

      $scope.id = $routeParams.id;
      $scope.provider = {};
      $scope.editing = false;
      var hasCallback = false;

      var updateProvider = function () {
        if ($scope.editing) return;

        $scope.provider = $scope._providers[$scope.id];
        if (!$scope.provider)
          $location.path('/providers');
        else if (!hasCallback) {
          hasCallback = true;
          $scope.$on('provider' + $scope.provider.id + "Done", updateProvider);
        }
      };

      if (Object.keys($scope._providers).length) {
        updateProvider();
      } else {
        $scope.$on('providersDone', updateProvider);
      }
    });
})();
