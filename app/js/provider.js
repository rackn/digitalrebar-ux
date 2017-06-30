/*
  Copyright 2017, RackN
  Provider controller
*/
(function () {
  angular.module('app')
  .controller('ProviderCtrl',[
    '$scope', '$location', '$routeParams', 'api', '$mdMedia', '$mdDialog',
    function ($scope, $location, $routeParams, api, $mdMedia, $mdDialog) {
      $scope.$emit('title', 'Provider'); // shows up on the top toolbar

      $scope.myOrder = 'name';

      this.getProviders = function () {
        let providers = [];
        for (let id in $scope._providers) {
          providers.push($scope._providers[id]);
        }
        return providers;
      };

      $scope.loadProvider = function(name) {
        return function(editor) {
          editor.setValue(
            JSON.stringify($scope.provider.auth_details[name], 0, '  '),
            -1
          );
          editor.getSession().on('change', function() {
            try {
              $scope.provider.auth_details[name] = JSON.parse(
                editor.getValue()
              );
            } catch (e) { /* eslint no-empty: off*/ }
          });
        };
      };

      $scope.restructureNodes = function(node) {
        return {
          order: node.name,
          status: api.getNodeStatus(node),
          name: node.name,
          icon: api.getNodeIcon(node),
          id: node.id,
        };
      };

      $scope.$on('keyDown', function (action, e) {
        if (e.key === 13) { // enter
          $scope.startEditing();
        }
        if (e.key === 27) { // escape
          $scope.stopEditing();
        }
      });

      $scope.deleteProvider = function(provider) {
        $scope.confirm(event, {
          title: 'Delete Provider',
          message: 'Are you sure you want to delete ' +
            provider.name + ' Provider?',
          yesCallback: function () {
            api('/api/v2/providers/' + provider.id, {
              method: 'DELETE'
            }).then(function () {
              $scope._providers[provider.id].name = 'DELETED-' +
                $scope._providers[provider.id].name;
              api.toast('Deleted ' + provider.name + ' capability');
              api.getHealth();
              $location.path('/providers');
            }, function (err) {
              api.toast('Error Deleted Provider', 'capability', err.data);
            });
          }
        });
      };

      $scope.saveProvider = function () {
        if (!$scope.editing)
          return;

        let data = angular.copy($scope.provider);
        api('/api/v2/providers/' + $scope.id, {
          method: 'PUT',
          data: data
        })
      .then(function(resp){api.addProvider(resp.data);}, function (err) {
        api.toast('Couldn\'t Save Provider', 'provider', err.data);
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

      $scope.showAddProviderDialog = function (ev, type) {
        let useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        let data = {
          name: type.toLowerCase(),
          description: 'Not Set',
          type: type,
          auth_details: {}
        };
        for (let key in $scope.providerTemplates[type]) {
          let val = $scope.providerTemplates[type][key];
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
        let useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        let providers = [];
        let provider;
        for(const id in $scope._providers) {
          providers.push($scope._providers[id]);
          if($scope._providers[id].name !== 'metal' &&
              $scope._providers[id].name !== 'phantom') {
            if(typeof provider === 'undefined') {
              provider = id;
            }
          }
        }
        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/addnodedialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            base_name: 'digital-rebar-node',
            _providers: providers,
            hasProvider: providers.length > 0,
            provider: $scope.provider.id,
            _profiles: $scope.rawProfiles([]),
            profiles: [],
            add_os: 'default_os',
            number: 1,
            _deployments: $scope._deployments
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        });
      };

      $scope.id = $routeParams.id;
      $scope.provider = undefined;
      $scope.editing = false;
      let hasCallback = false;

      function updateProvider() {
        if ($scope.editing) return;

        $scope.provider = $scope._providers[$scope.id];
        if (!$scope.provider) {
          $location.path('/providers');
        } else if (!hasCallback) {
          hasCallback = true;
          $scope.$on('provider' + $scope.provider.id + 'Done', updateProvider);
        }
      }

      if (Object.keys($scope._providers).length) {
        updateProvider();
      } else {
        $scope.$on('providersDone', updateProvider);
      }
    }
  ]);
})();
