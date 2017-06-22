/*
  Copyright 2017, RackN
  Role Controller
*/
(function () {
  angular.module('app').controller('RolesCtrl', [
    '$scope', 'debounce', '$routeParams', '$mdMedia', '$mdDialog', 'api',
    function ($scope, debounce, $routeParams, $mdMedia, $mdDialog, api) {

      $scope.$emit('title', 'Roles'); // shows up on the top toolbar

      $scope.query = {
        page: 1,
        limit: 10,
      };

      $scope.myOrder = 'name';
      $scope.flags = ['library', 'implicit', 'bootstrap',
        'discovery', 'cluster', 'destructive', 'abstract', 'powersave'
      ];

      $scope.restructureRoles = function(node_role) {
        return {
          order: node_role.cohort,
          status: node_role.status,
          name: $scope._nodes[node_role.node_id].name,
          icon: $scope.icons[node_role.status],
          id: node_role.id,
        };
      };

      // converts the _roles object that rootScope has into an array
      $scope.getRoles = function () {
        let roles = [];
        for (let id in $scope._roles) {
          roles.push($scope._roles[id]);
        }
        return roles;
      };

      $scope.id = $routeParams.id;
      $scope.target = { obj: 'role_id', id: $routeParams.id };
      $scope.role = {};
      $scope.metadata = {};
      $scope.scripts = [];
      $scope.editing = false;
      $scope.relations = {
        Parents: [],
        Children: [],
        Provides: [],
        Conflicts: []
      };
      let hasCallback = false;

      $scope.retry = function () {
        Object.keys($scope._node_roles).forEach(function(id) {
          let nr = $scope._node_roles[id];
          if (nr.role_id === $scope.id) {
            api('/api/v2/node_roles/' + id + '/retry', {
              method: 'PUT'
            }).then(function (resp) {
              api.addNodeRole(resp.data);
              api.toast('Retried Role ' + $scope.role.name +
                ' on Node ID ' + nr.node_id);
            }, function (err) {
              api.toast('Error retrying node role', 'node_role', err.data);
            });
          }
        });
      };

      $scope.assignDeployment = function(role_id, deployment_id) {
        api('/api/v2/deployment_roles/', {
          method: 'POST',
          data: {
            deployment_id: deployment_id,
            add_role: {
              role_id: role_id
            }
          }
        }).then(function(resp){
          api.addDeploymentRole(resp.data);
        }, function (err) {
          api.toast('Error Adding Deployment Role',
            'deployment_role', err.data);
        });
      };

      function updateRole() {
        if ($scope.editing) return;

        $scope.role = $scope._roles[$scope.id];

        //console.log($scope.metadata)
        if (typeof $scope.role !== 'undefined') {
          // find parents and chidlren
          for (let id in $scope._roles) {
            let r = $scope._roles[id];
            if ('requires' in $scope.role &&
                $scope.role.requires.includes(r.name))
              $scope.relations['Parents'].push(r);
            else if ('requires' in $scope._roles[id] &&
                $scope._roles[id].requires.includes($scope.role.name))
              $scope.relations['Children'].push(r);
            else if ('provides' in $scope.role &&
                $scope.role.provides.includes(r.name))
              $scope.relations['Provides'].push(r);
            else if ('conflicts' in $scope.role &&
                $scope.role.conflicts.includes(r.name))
              $scope.relations['Conflicts'].push(r);
          }
          $scope.metadata = $scope.role.metadata;
          if ($scope.role.jig_name === 'script' &&
              $scope.role.metadata)
            $scope.scripts = $scope.role.metadata.scripts;
          if ($scope.role.jig_name === 'ansible-playbook' &&
              $scope.role.metadata.files) {
            for (let i in $scope.metadata.files) {
              if (typeof $scope.metadata.files[i].body === 'string')
                $scope.metadata.files[i].temp = $scope.metadata.files[i].body;
              else
                $scope.metadata.files[i].temp = $scope.metadata.files[i].body
                .join('\n');
            }
          }
          if (!hasCallback) {
            hasCallback = true;
            $scope.$on('role' + $scope.role.id + 'Done', updateRole);
          }
        }
      }

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
        let s = '#!/bin/bash\necho "hello"\nexit 0\n';
        $scope.scripts.push(s);
      };

      $scope.saveScripts = function() {
        api('/api/v2/barclamps/' + $scope.role.barclamp_id)
        .then(function(resp) {
          let bc = resp.data;
          let roles = bc.cfg_data.roles;
          for (let r in roles) {
            if (roles[r].name === $scope.role.name) {
              delete roles[r].metadata.scripts;
              roles[r].metadata.scripts = [];
              for (let i in $scope.scripts) {
                roles[r].metadata.scripts.push($scope.scripts[i]);
              }
              api.saveBarclamp(bc.cfg_data);
            }
          }
        });
      };

      $scope.removeFile = function(index) {
        $scope.metadata['files'].splice(index, 1);
        api.toast('Removed Ansible File', 'file', index);
      };

      $scope.addFile = function() {
        let s = {type: 'tasks', name: 'main.yml', body:
        ['---',
          '- debug: msg="Ansibile Metadata Role"',
          '- debug: var="hints"',
          '- debug: var="rebar_wall"']};
        $scope.metadata['files'].push(s);
      };

      $scope.saveAnsible = function() {
        if ($scope.role.jig_name === 'ansible-playbook' &&
            $scope.metadata.files) {
          for (let i in $scope.metadata.files) {
            $scope.metadata.files[i].body = $scope.metadata.files[i].temp
            .split('\n');
          }
        }
        api('/api/v2/barclamps/' + $scope.role.barclamp_id)
        .then(function(resp) {
          let bc = resp.data;
          let roles = bc.cfg_data.roles;
          for (let r in roles) {
            if (roles[r].name === $scope.role.name) {
              roles[r].metadata = $scope.metadata;
              for (let i in roles[r].metadata.files) {
                delete roles[r].metadata.files[i].temp;
              }
              api.saveBarclamp(bc.cfg_data);
            }
          }
        });
      };
    }
  ]);
})();
