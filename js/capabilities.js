/*
capabilities controller
*/
(function () {
  angular.module('app')
    .controller('CapabilitiesCtrl', function ($scope, api, $mdMedia, $mdDialog, $routeParams) {
      $scope.$emit('title', 'Capabilities'); // shows up on the top toolbar

      $scope.updateCapability = function(cap) {
        console.debug({ 'includes': cap.includes });
        api('/api/v2/capabilities/'+ cap.id, {
          method: 'PUT',
          data: { 'includes': cap.includes }
        }).success(function (update) {
          api.getHealth();
        }).error(function (err) {
          api.getHealth();
        });
      };

      $scope.deleteCapability = function(cap) {
        $scope.confirm(event, {
          title: "Delete Capability",
          message: "Are you sure you want to delete selected capability?",
          yesCallback: function () {
            api('/api/v2/capabilities/' + cap.id, {
              method: 'DELETE'
            }).error(function (err) {
              api.toast('Error Deleted Capability', 'capability', err);
            }).success(function () {
              api.toast('Deleted ' + capability + ' capability');
            })
          }
        });
      };

      $scope.rawCapabilities = function(current) {
        raw = [];
        for (var i in $scope._capabilities) {
          if (!current.includes($scope._capabilities[i].name))
            raw.push($scope._capabilities[i].name);
        }
        return raw;
      };

    })
    .filter('groupsonly', function(){
      return function(cap) {
        filter = [];
        for (var i in cap) {
          if (cap[i].source === "dr-groups")
            filter.push(cap[i]);
        }
        return filter;
      }
    });
})();
