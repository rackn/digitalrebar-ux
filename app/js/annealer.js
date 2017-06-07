/*
  Copyright 2017, RackN
  Annealer Controller
*/
(function () {
  angular.module('app').controller('AnnealerCtrl', [
    '$scope', 'api',
    function ($scope, api) {
      $scope.$emit('title', 'Annealer'); // shows up on the top toolbar

      $scope.selected = -1;

      $scope.setNode = function (id) {
        $scope.$emit('title', 'Annealer ' + (id !== -1 ?
          '(' + $scope._nodes[id].name + ')' : ''));
        $scope.selected = id;
      };

      $scope.getNodeRoles = function (status) {
        let roles = [];
        for (let id in $scope._node_roles) {
          let role = $scope._node_roles[id];
          if (status === role.status)
            roles.push(role);
        }
        return roles;
      };

      $scope.retryAll = function () {
        $scope.getNodeRoles('error').forEach(function (role) {
          api('/api/v2/node_roles/' + role.id + '/retry', {
            method: 'PUT'
          }).then(function(resp) {
            api.addNodeRole(resp.data);
          });
        });
      };

      $scope.statesList = ['error', 'process', 'todo', 'queue'];

    }
  ]);
})();
