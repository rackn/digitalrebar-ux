/*
  Copyright 2017, RackN
  Provisioner Controller
*/
(function () {
  angular.module('app')
  .controller('ProfileCtrl', [
    '$scope', 'api', '$location', '$mdDialog', '$mdMedia', '$routeParams',
    function ($scope, api, $location, $mdDialog, $mdMedia, $routeParams) {
      var title = 'Profiles';

      $scope.attribs = {}
      $scope.expand = {};
      $scope.values = {};
      $scope.profile_count = -1;
      $scope.valueOrder = 'key';

      var deregister = $scope.$watchCollection('_profiles', function(profiles){
        $scope.profile_count = Object.keys(profiles).length;
        $scope.values = {};
        Object.keys(profiles).forEach(function(id) {
          var profile = profiles[id];
          $scope.values[id] = Object.keys(profile.values).map(function(key) {
            return {key: key, value: profile.values[key]};
          });
        });
      });

      $scope.$on('$destroy', deregister);

      api('/api/v2/attribs').then(function (resp) {
        var attribs = resp.data;
        $scope.attribs = attribs.reduce(function(map, obj) {
          if (obj.writable && (obj.schema != null && obj.schema != '')) {
            map[obj.name] = obj;
          }
          return map;
        }, $scope.attribs);
        $scope.profile_count = Object.keys($scope._profiles).length;
      });
      $scope.$emit('title', title);

      if ($routeParams.id)
        $scope.expand[$routeParams.id] = true;

      $scope.deleteProfile = function (name) {
        $scope.confirm(event, {
          title: 'Remove Profile',
          message: 'Are you sure you want to remove "' + name + '" profile?',
          yesCallback: function () {
            api('/api/v2/profiles/' + name, {
              method: 'DELETE'
            }).then(function () {
              api.getHealth();
              for (var id in $scope._profiles) {
                if ($scope._profiles[id].name==name)
                  delete $scope._profiles[id];
              }
              $scope.profile_count = Object.keys($scope._profiles).length;
            }, function () {
              api.getHealth();
            });
          }
        });
      };

      $scope.createProfilePrompt = function (ev, prof) {
        var profile = angular.copy(prof);

        var values = {};
	      var name = '';
        if (typeof profile !== 'undefined') {
          name = profile.name;
          for(var key in profile.values) {
            values[key] = {name: key, value: JSON.stringify(profile.values[key])};
          }
        }
        $scope.profile_count = 1;

        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/addprofiledialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            editing: (typeof profile !== 'undefined'),
            attribs: $scope.attribs,
            profile: {
              name: name,
              values: values
            },
            original: angular.copy(profile)
          },
          clickOutsideToClose: true,
          fullscreen: true
        });
      };
    }
  ]);
})();
