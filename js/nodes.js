/*
node controller
*/
(function () {
  angular.module('app').controller('NodesCtrl', function ($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog, api) {

    $scope.$emit('title', 'Nodes'); // shows up on the top toolbar

    var nodes = this;
    this.selected = [];
    $scope.move_tenant = true;

    // converts the _nodes object that rootScope has into an array
    this.getNodes = function () {
      var nodes = [];
      for (var id in $scope._nodes) {
        if (!$scope._nodes[id].system)
          nodes.push($scope._nodes[id]);
      }
      return nodes;
    };

    this.deleteSelected = function (event) {
      $scope.confirm(event, {
        title: "Delete Nodes",
        message: "Are you sure you want to delete selected nodes?",
        yesCallback: function () {
          nodes.selected.forEach(function (node) {

            if (node.admin) {
              console.log("Can't delete admin node !" + node.id);
              return;
            }

            console.log("Deleting node " + node.id);

            // the api call uses REST DELETE on /nodes/id to remove a node 
            api('/api/v2/nodes/' + node.id, { method: 'DELETE' }).
            success(function () {
              console.log("Node deleted");
            }).success(function () {
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
        title: "Delete Node",
        message: "Are you sure you want to delete " + $scope.node.name,
        yesCallback: function () {

          if ($scope.node.admin) {
            console.log("Can't delete admin node!");
            api.toast("Cannot delete admin node");
            return;
          }

          console.log("Deleting node " + $scope.node.id);

          // the api call uses REST DELETE on /nodes/id to remove a node 
          api('/api/v2/nodes/' + $scope.node.id, { method: 'DELETE' }).
          success(function () {
            console.log("Node deleted");
          }).success(function () {
            api.remove('node', $scope.node.id);
            $location.path("/nodes");
          });

        }
      });
    };

    $scope.rawProfiles = function(current) {
      raw = [];
      for (var i in $scope._profiles) {
        if (!current.includes($scope._profiles[i].name))
          raw.push($scope._profiles[i].name);
      }
      return raw;
    };

    this.showAddNodeDialog = function (ev) {
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
      var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
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
        var d = {
            node_deployment: {
              deployment_id: deployment_id,
              old_deployment: node.deployment_id
            }
          };
        if (move_tenant) {
          d.tenant_id = $scope._deployments[deployment_id].tenant_id;
        }
        api("/api/v2/nodes/" + node.id, {
          method: "PUT",
          data: d
        }).success(api.addNode);
      });
    };

    $scope.assignNodesToTenant = function (arr, tenant_id) {
      arr.forEach(function (node) {
        api("/api/v2/nodes/" + node.id, {
          method: "PUT",
          data: {
            tenant_id: tenant_id
          }
        }).success(api.addNode);
      });
    };

    // creates an array of unused roles for a specified deployment
    $scope.getRoles = function () {
      var roles = [];
      var deployment_id = $scope.node.deployment_id;
      for (var id in $scope._deployment_roles) {
        var deployment_role = $scope._deployment_roles[id];
        if (deployment_role.deployment_id == deployment_id) {
          roles.push(deployment_role);
        }
      }
      return roles;
    }

    // binds a node role to the deployment, role, and node
    $scope.bindNodeRole = function (role_id) {
      var node_id = $scope.node.id;
      var deployment_id = $scope.deployment_id;
      api("/api/v2/node_roles/", {
        method: "POST",
        data: {
          node_id: node_id,
          deployment_id: deployment_id,
          role_id: role_id
        }
      }).success(api.addNodeRole).
      error(function (err) {
        api.toast("Error Adding Node Role", 'node_role', err);
      });
    };

    $scope.setPower = function (action) {
      $scope.confirm(event, {
        title: "Redeploy Node",
        message: "Are you sure you want to set power to "+action+"?",
        yesCallback: function () {
          // if we have a valid node selected
          if ($scope.node.id) {
            api('/api/v2/nodes/' + $scope.node.id + '/power', {
              data: { poweraction: action},
              method: 'PUT'
            }).success(api.addNode).error(function (err) {
              api.toast('Error Powering Node', 'node', err);
            });
          }
        }
      });
    };

    $scope.redeploy = function () {
      $scope.confirm(event, {
        title: "Redeploy Node",
        message: "Are you sure you want to redeploy this node?",
        yesCallback: function () {
          // if we have a valid node selected
          if ($scope.node.id) {
            api('/api/v2/nodes/' + $scope.node.id + '/redeploy', {
              method: 'PUT'
            }).success(api.addNode).error(function (err) {
              api.toast('Error Redeploying Node', 'node', err);
            });
          }
        }
      });
    };

    $scope.reserve = function (reserve) {
      // if we have a valid node selected
      if ($scope.node.id) {
        api('/api/v2/nodes/' + $scope.node.id, {
          method: 'PUT',
          data: { 'available': !reserve }
        }).success(api.addNode).error(function (err) {
          api.toast('Error Reserving', 'node', err);
        });
      }
    };

    $scope.redeploySelected = function () {
      $scope.confirm(event, {
        title: "Redeploy Nodes",
        message: "Are you sure you want to redeploy selected nodes?",
        yesCallback: function () {
          nodes.selected.forEach(function (node) {
            if (node.id) {
              api('/api/v2/nodes/' + node.id + '/redeploy', {
                method: 'PUT'
              }).error(function (err) {
                api.toast('Error Redeploying Node', 'node', err);
              }).success(function () {
                api.toast('Redeployed ' + nodes.selected.length + ' node' + (nodes.selected.length == 1 ? '' : 's'));
              })
            }
          })
        }
      })
    }

    $scope.saveAttrib = function () {
      if (!$scope.editing)
        return;

      var data = angular.copy($scope.attribs);
      data.forEach(function (attrib) {
        if (!attrib.writable)
          return;
        api("/api/v2/providers/" + $scope.id, {
          method: "POST",
          data: data
        });
        error(function (e) {
          api.toast("Couldn't Save Attrib", 'attrib', e);
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
      if ($scope.editing && $scope.hasAttrib == 1)
        return;

      $scope.editing = true;
      $scope._attribs = angular.copy($scope.attribs);
    };

    $scope.id = $routeParams.id;
    $scope.target = { obj: 'node_id', id: $routeParams.id }
    $scope.node = {};
    $scope.hasAttrib = -1;
    $scope.attribs = [];
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
    var hasCallback = false;

    var updateNode = function () {
      if ($scope.editing) return;

      $scope.node = $scope._nodes[$scope.id];

      if (!$scope.node)
        $location.path('/nodes');
      else {

        api("/api/v2/nodes/" + $scope.node.id + "/power").
        success(function (obj) {
          // remove non-action power options
          for (var i in obj) {
            if (["status", "on?"].includes(obj[i]))
              obj.splice(i, 1);
          }
          $scope.power = obj;
        });

        api("/api/v2/nodes/" + $scope.node.id + "/network_allocations").
        success(function (obj) {
          //$scope.nics = obj;
          for (var i in obj) {
            if (!$scope.nics[obj[i].network_id])
              $scope.nics[obj[i].network_id] = [];
            $scope.nics[obj[i].network_id].push(obj[i]);
          };
        });

        if ($scope.hasAttrib == -1) {
          api('/api/v2/nodes/' + $scope.node.id + "/attribs").
          success(function (obj) {
            $scope.attribs = obj;
            obj.forEach(function (attrib) {
              attrib.len = JSON.stringify(attrib.value).length
              attrib.preview = JSON.stringify(attrib.value, null, '  ').trim().replace(/[\s\n]/g, '')
              if (attrib.value == null)
                attrib.value = 'Not Set';
              if (attrib.preview.length > 73)
                attrib.preview = attrib.preview.substr(0, 67) + "...";
            });
            $scope.hasAttrib = 1;
          }).
          error(function () {
            $scope.hasAttrib = 0;
          });
        }

        if (!hasCallback) {
          hasCallback = true;
          $scope.$on('node' + $scope.node.id + "Done", updateNode);
        }
      }

    };

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

  });

})();
