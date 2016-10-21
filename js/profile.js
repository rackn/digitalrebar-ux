/*
provisioner controller
*/
(function () {
  angular.module('app')
    .controller('ProfileCtrl', function ($scope, api, $location, $mdDialog, $mdMedia, $routeParams) {

      var title = 'Profiles';

      $scope.attribs = {}
      $scope.expand = {};

      api("/api/v2/attribs").success(function (attribs) {
        $scope.attribs = attribs.reduce(function(map, obj) {
          if (obj.writable && (obj.schema != null && obj.schema != "")) {
            map[obj.name] = obj;
          }
          return map;
        }, $scope.attribs);
      });
      $scope.$emit('title', title);

      if ($routeParams.id)
        $scope.expand[$routeParams.id] = true;

      $scope.deleteProfile = function (name) {
        $scope.confirm(event, {
          title: "Remove Profile",
          message: "Are you sure you want to remove this profile?",
          yesCallback: function () {
            api('/api/v2/profiles/' + name, {
              method: 'DELETE'
            }).success(function (data) {
              api.getHealth();
            }).error(function () {
              api.getHealth();
            });
          }
        });
      };

      $scope.createProfilePrompt = function (ev, prof) {
        var profile = angular.copy(prof);

        var values = {};
	var name = "";
        if (typeof profile !== 'undefined') {
          name = profile.name
          for(var key in profile.values) {
            values[key] = { "name": key, "value": JSON.stringify(profile.values[key]) }
          }
        }

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

    });
})();
