/*
  Copyright 2017, RackN
  Node Controller
*/
(function () {
  angular.module('app').controller('NodesCtrl', [
    '$scope', '$location', 'debounce', '$routeParams', '$mdMedia', '$mdDialog',
    'api',
    function ($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog,
      api) {

      $scope.$emit('title', 'Nodes'); // shows up on the top toolbar

      let nodes = this;
      this.selected = [];
      $scope.move_tenant = true;

      $scope.restructureRoles = function(role) {
        return {
          order: role.cohort,
          status: role.status,
          name: $scope._roles[role.role_id].name,
          icon: $scope._roles[role.role_id].icon,
          id: role.id,
        };
      };

      // converts the _nodes object that rootScope has into an array
      this.getNodes = function () {
        let nodes = [];
        for (let id in $scope._nodes) {
          if (!$scope._nodes[id].system)
            nodes.push($scope._nodes[id]);
        }
        return nodes;
      };

      this.deleteSelected = function (event) {
        $scope.confirm(event, {
          title: 'Delete Nodes',
          message: 'Are you sure you want to delete selected nodes?',
          yesCallback: function () {
            nodes.selected.forEach(function (node) {

              if (node.admin) {
                console.log('Can\'t delete admin node !' + node.id);
                return;
              }

              console.log('Deleting node ' + node.id);

              // the api call uses REST DELETE on /nodes/id to remove a node
              api('/api/v2/nodes/' + node.id, { method: 'DELETE' })
              .then(function () {
                console.log('Node deleted');
              }).then(function () {
                api.remove('node', node.id);
              });
            });

            // remove the selected items
            nodes.selected = [];
          }
        });
      };

      this.deleteNode = function (event) {
        $scope.confirm(event, {
          title: 'Delete Node',
          message: 'Are you sure you want to delete ' + $scope.node.name,
          yesCallback: function () {

            if ($scope.node.admin) {
              console.log('Can\'t delete admin node!');
              api.toast('Cannot delete admin node');
              return;
            }

            console.log('Deleting node ' + $scope.node.id);

            // the api call uses REST DELETE on /nodes/id to remove a node
            api('/api/v2/nodes/' + $scope.node.id, { method: 'DELETE' })
            .then(function () {
              console.log('Node deleted');
              api.remove('node', $scope.node.id);
              $location.path('/nodes');
            });

          }
        });
      };

      $scope.rawProfiles = function(current) {
        let raw = [];
        for (let i in $scope._profiles) {
          if (!current.includes($scope._profiles[i].name))
            raw.push($scope._profiles[i].name);
        }
        return raw;
      };

      this.showAddNodeDialog = function (ev) {
        let useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/addnodedialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            base_name: 'digital-rebar-node',
            _providers: $scope._providers,
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

      this.showEditNodeDialog = function (ev, node) {
        let useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/editnodedialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            _profiles: $scope.rawProfiles(node.profiles),
            node: node,
            name1: node.name,
            description1: node.description,
            profiles1: node.profiles,
            id: node.id
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        });
      };

      $scope.assignNodes = function (arr, deployment_id, move_tenant) {
        arr.forEach(function (node) {
          let d = {
            node_deployment: {
              deployment_id: deployment_id,
              old_deployment: node.deployment_id
            }
          };
          if (move_tenant) {
            d.tenant_id = $scope._deployments[deployment_id].tenant_id;
          }
          api('/api/v2/nodes/' + node.id, {
            method: 'PUT',
            data: d
          }).then(function(resp){api.addNode(resp.data);});
        });
      };

      $scope.assignNodesToTenant = function (arr, tenant_id) {
        arr.forEach(function (node) {
          api('/api/v2/nodes/' + node.id, {
            method: 'PUT',
            data: {
              tenant_id: tenant_id
            }
          }).then(function(resp){api.addNode(resp.data);});
        });
      };

      // creates an array of unused roles for a specified deployment
      $scope.getRoles = function () {
        let roles = [];
        let deployment_id = $scope.node.deployment_id;
        for (let id in $scope._deployment_roles) {
          let deployment_role = $scope._deployment_roles[id];
          if (deployment_role.deployment_id === deployment_id) {
            roles.push(deployment_role);
          }
        }
        return roles;
      };

      // binds a node role to the deployment, role, and node
      $scope.bindNodeRole = function (role_id) {
        let node_id = $scope.node.id;
        let deployment_id = $scope.deployment_id;
        api('/api/v2/node_roles/', {
          method: 'POST',
          data: {
            node_id: node_id,
            deployment_id: deployment_id,
            role_id: role_id
          }
        }).then(function(resp){api.addNodeRole(resp.data);}, function (err) {
          api.toast('Error Adding Node Role', 'node_role', err.data);
        });
      };

      $scope.setPower = function (action) {
        $scope.confirm(event, {
          title: 'Redeploy Node',
          message: 'Are you sure you want to set power to ' + action + '?',
          yesCallback: function () {
            // if we have a valid node selected
            if ($scope.node.id) {
              api('/api/v2/nodes/' + $scope.node.id + '/power', {
                data: { poweraction: action},
                method: 'PUT'
              }).then(function(resp){api.addNode(resp.data);}, function (err) {
                api.toast('Error Powering Node', 'node', err.data);
              });
            }
          }
        });
      };

      $scope.redeploy = function (target) {
        $scope.confirm(event, {
          title: 'Redeploy Node',
          message: 'Are you sure you want to redeploy this node?',
          yesCallback: function () {
            $scope.redeploy_target($scope.node.id, target);
          }
        });
      };

      $scope.redeploy_target = function (node_id, target) {
        api('/api/v2/nodes/' + node_id + '/propose', {
          method: 'PUT'})
        .then(function () {
          if (target) {
            api('/api/v2/nodes/' + node_id + '/attribs/provisioner-target_os', {
              method: 'GET'})
            .then(function (resp) {
              let a = resp.data;
              api('/api/v2/attribs/' + a.id, {
                method: 'PUT',
                data: {node_id: a.node_id, role_id: a.role_id, value: target}
              }).then(function () {
                api('/api/v2/nodes/' + node_id + '/redeploy', {
                  method: 'PUT'
                }).then(function () {
                  api.toast('Redeployed node ' + node_id);
                }, function (err) {
                  api.toast('Error Redeploying Node', 'node', err.data);
                });
              });
            });
          } else {
            api('/api/v2/nodes/' + node_id + '/redeploy', {
              method: 'PUT'
            }).then(function () {
              api.toast('Redeployed node ' + node_id);
            }, function (err) {
              api.toast('Error Redeploying Node', 'node', err.data);
            });
          }
        });
      };

      $scope.reserve = function (reserve) {
        // if we have a valid node selected
        if ($scope.node.id) {
          api('/api/v2/nodes/' + $scope.node.id, {
            method: 'PUT',
            data: { 'available': !reserve }
          }).then(function(resp){
            api.addNode(resp.data);
          }, function (err) {
            api.toast('Error Reserving', 'node', err.data);
          });
        }
      };

      $scope.redeploySelected = function () {
        $scope.confirm(event, {
          title: 'Redeploy Nodes',
          message: 'Are you sure you want to redeploy selected nodes?',
          yesCallback: function () {
            nodes.selected.forEach(function (node) {
              if (node.id) {
                api('/api/v2/nodes/' + node.id + '/redeploy', {
                  method: 'PUT'
                }).then(function () {
                  api.toast('Redeployed ' + nodes.selected.length + ' node' +
                    (nodes.selected.length === 1 ? '' : 's'));
                }, function (err) {
                  api.toast('Error Redeploying Node', 'node', err.data);
                });
              }
            });
          }
        });
      };

      $scope.saveAttrib = function () {
        if (!$scope.editing)
          return;

        let data = angular.copy($scope.attribs);
        data.forEach(function (attrib) {
          if (!attrib.writable)
            return;
          api('/api/v2/providers/' + $scope.id, {
            method: 'POST',
            data: data
          }, function (e) {
            api.toast('Couldn\'t Save Attrib', 'attrib', e);
          });

        });
        $scope.stopEditing();
      };

      $scope.stopEditing = function () {
        if (!$scope.editing)
          return;

        $scope.attribs = $scope._attribs;
        $scope.provider = $scope._providers[$scope.id];
        $scope.editing = false;
      };

      $scope.startEditing = function () {
        if ($scope.editing && $scope.hasAttrib === 1)
          return;

        $scope.editing = true;
        $scope._attribs = angular.copy($scope.attribs);
      };

      $scope.id = $routeParams.id;
      $scope.target = { obj: 'node_id', id: $routeParams.id };
      $scope.node = {};
      $scope.hasAttrib = -1;
      $scope.attribs = [];
      $scope.serial = undefined;
      $scope.bmc = undefined;
      $scope.power = [];
      $scope.nics = {};
      // icons used by nodes for power values
      $scope.powers = {
        'identify': 'lightbulb_outline',
        'on': 'settings_power',
        'off': 'power_settings_new',
        'cycle': 'loop',
        'reboot': 'settings_backup_restore',
        'reset': 'settings_backup_restore',
        'halt': 'gavel'
      };
      $scope.editing = false;
      let hasCallback = false;

      function updateNode() {
        if ($scope.editing) return;

        $scope.node = $scope._nodes[$scope.id];

        if (!$scope.node)
          $location.path('/nodes');
        else {

          api('/api/v2/nodes/' + $scope.node.id + '/power')
          .then(function (resp) {
            let obj = resp.data;
            // remove non-action power options
            for (let i in obj) {
              if (['status', 'on?'].includes(obj[i]))
                obj.splice(i, 1);
            }
            $scope.power = obj;
          });

          api('/api/v2/nodes/' + $scope.node.id + '/network_allocations')
          .then(function (resp) {
            let obj = resp.data;
            $scope.nics = {};
            //$scope.nics = obj;
            for (let i in obj) {
              if (!$scope.nics[obj[i].network_id])
                $scope.nics[obj[i].network_id] = [];
              $scope.nics[obj[i].network_id].push(obj[i]);
            }
          });

          if ($scope.hasAttrib === -1) {
            api('/api/v2/nodes/' + $scope.node.id + '/attribs')
            .then(function (resp) {
              let obj = resp.data;
              $scope.attribs = obj;
              obj.forEach(function (attrib) {
                let blob = JSON.stringify(attrib.value);
                attrib.len = blob.length;
                attrib.preview = JSON.stringify(attrib.value, null, '  ')
                .trim()
                .replace(/[\s\n]/g, '');
                if (typeof attrib.value === 'undefined')
                  attrib.value = 'Not Set';
                if (attrib.preview.length > 73)
                  attrib.preview = attrib.preview.substr(0, 67) + '...';
                if (attrib.name === 'ipmi-address')
                  $scope.bmc = attrib.value;
                if (attrib.name === 'chassis_serial_number')
                  $scope.serial = attrib.value;
              });
              $scope.hasAttrib = 1;
            }, function () {
              $scope.hasAttrib = 0;
            });
          }

          if (!hasCallback) {
            hasCallback = true;
            $scope.$on('node' + $scope.node.id + 'Done', updateNode);
          }
        }

      }

      if (Object.keys($scope._nodes).length) {
        updateNode();
      } else {
        $scope.$on('nodesDone', function () {
          if (typeof $scope._nodes[$scope.id] === 'undefined')
            $location.path('/nodes');
          else
            updateNode();
        });
      }
    }
  ]);
})();
