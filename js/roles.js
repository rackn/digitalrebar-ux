/*
role controller
*/
(function () {
  angular.module('app').controller('RolesCtrl', function ($scope, debounce, $routeParams, $mdMedia, $mdDialog, api) {

    $scope.$emit('title', 'Roles'); // shows up on the top toolbar

    $scope.myOrder = 'jig_name';
    $scope.flags = ["library", "implicit", "bootstrap",
      "discovery", "cluster", "destructive", "abstract", "powersave"
    ];

    // converts the _roles object that rootScope has into an array
    $scope.getRoles = function () {
      var roles = [];
      for (var id in $scope._roles) {
        roles.push($scope._roles[id]);
      }
      return roles;
    }

    $scope.id = $routeParams.id;
    $scope.target = { obj: 'role_id', id: $routeParams.id }
    $scope.role = {};
    $scope.metadata = {};
    $scope.editing = false;
    $scope.relations = {"Parents": [], "Children": [], "Provides": [], "Conflicts": []};
    var hasCallback = false;

    $scope.retry = function () {
      for (var id in $scope._node_roles) {
        var nr = $scope._node_roles[id];
        if (nr.role_id == $scope.id) {
          api('/api/v2/node_roles/' + id + '/retry', {
            method: 'PUT'
          })
          .success(api.addNodeRole).success( function () {
            api.toast('Retried Role ' + $scope.role.name + " on Node ID " + nr.node_id);
          })
          .error(function (err) {
            api.toast('Error retrying node role', 'node_role', err);
          });
        }
      }
    }

    var updateRole = function () {
      if ($scope.editing) return;

      $scope.role = $scope._roles[$scope.id];

      // find parents and chidlren
      for (var id in $scope._roles) {
        var r = $scope._roles[id];
        if ($scope.role.requires.includes(r.name))
          $scope.relations["Parents"].push(r);
        else if ($scope._roles[id].requires.includes($scope.role.name))
          $scope.relations["Children"].push(r);
        else if ($scope.role.provides.includes(r.name))
          $scope.relations["Provides"].push(r);
        else if ($scope.role.conflicts.includes(r.name))
          $scope.relations["Conflicts"].push(r);
      }

      $scope.metadata = JSON.stringify($scope.role.metadata, null, "  ")
      //console.log($scope.metadata)
      if (!$scope.role)
        $location.path('/api/v2/roles');
      else if (!hasCallback) {
        hasCallback = true;
        $scope.$on('role' + $scope.role.id + "Done", updateRole);
      }
    };

    if (Object.keys($scope._roles).length) {
      updateRole();
    } else {
      $scope.$on('rolesDone', updateRole);
    }

  });

})();
