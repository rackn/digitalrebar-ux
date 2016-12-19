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
    $scope.scripts = [];
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

    $scope.assignDeployment = function(role_id, deployment_id) {
      api("/api/v2/deployment_roles/", {
        method: "POST",
        data: {
          deployment_id: deployment_id,
          add_role: {
            role_id: role_id
          }
        }
      }).success(api.addDeploymentRole).
      error(function (err) {
        api.toast("Error Adding Deployment Role", 'deployment_role', err);
      });      
    };

    var updateRole = function () {
      if ($scope.editing) return;

      $scope.role = $scope._roles[$scope.id];

      //console.log($scope.metadata)
      if (typeof $scope.role != 'undefined') {
        // find parents and chidlren
        for (var id in $scope._roles) {
          var r = $scope._roles[id];
          if ('requires' in $scope.role && $scope.role.requires.includes(r.name))
            $scope.relations["Parents"].push(r);
          else if ('requires' in $scope._roles[id] && $scope._roles[id].requires.includes($scope.role.name))
            $scope.relations["Children"].push(r);
          else if ('provides' in $scope.role && $scope.role.provides.includes(r.name))
            $scope.relations["Provides"].push(r);
          else if ('conflicts' in $scope.role && $scope.role.conflicts.includes(r.name))
            $scope.relations["Conflicts"].push(r);
        }
        $scope.metadata = $scope.role.metadata
        if ($scope.role.jig_name=='script' && $scope.role.metadata)
          $scope.scripts = $scope.role.metadata.scripts;

        if (!hasCallback) {
          hasCallback = true;
          $scope.$on('role' + $scope.role.id + "Done", updateRole);
        }
      }
    };

  if (Object.keys($scope._roles).length) {
    updateRole();
  } else {
    $scope.$on('rolesDone', updateRole);
  }

  $scope.removeSection = function(index) {
    delete $scope.scripts[index];
    api.toast('Removed Script', 'role', index);
  };

  $scope.addSection = function() {
    s = '#!/bin/bash\necho "hello"\nexit 0\n';
    $scope.scripts.push(s);
  };

  $scope.saveScripts = function(event) {
    api("/api/v2/barclamps/" + $scope.role.barclamp_id).
    success(function(bc) {
      var roles = bc.cfg_data.roles;
      for (var r in roles) {
        if (roles[r].name == $scope.role.name) {
          delete roles[r].metadata.scripts;
          roles[r].metadata.scripts = [];
          for (var i in $scope.scripts) {
            roles[r].metadata.scripts.push($scope.scripts[i]); 
          }
          api.saveBarclamp(bc.cfg_data);
        };
      };
    });
  };

  });


})();
