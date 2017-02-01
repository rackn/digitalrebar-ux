/*
deployments controller
*/
(function () {
  angular.module('app').controller('DeploymentsCtrl', function ($mdMedia, $mdDialog, $scope, $http, debounce, $timeout, $routeParams, api, $filter) {
    $scope.$emit('title', 'Deployments'); // shows up on the top toolbar

    var deployments = this;

    // when a node is clicked, this dialog appears (see nodedialog.tmpl.html)
    this.showNodeDialog = function (ev, node) {
      $scope.node = node;
      var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
      $mdDialog.show({
        controller: 'DialogController',
        controllerAs: 'ctrl',
        templateUrl: 'nodedialog.tmpl.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        locals: {
          node: $scope.node
        },
        clickOutsideToClose: true,
        fullscreen: useFullScreen
      });
    };

    $scope.showAddNodeDialog = function (ev, id) {
      var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
      $mdDialog.show({
        controller: 'DialogController',
        controllerAs: 'dialog',
        templateUrl: 'views/dialogs/addnodedialog.tmpl.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        locals: {
          base_name: 'digital-rebar-node',
          providers: $scope._providers,
          add_os: 'default_os',
          number: 1,
          _deployments: $scope._deployments,
          deployment_id: id
        },
        clickOutsideToClose: true,
        fullscreen: useFullScreen
      });
    };

    $scope.expand = {};
    $scope.graphData = {};
    $scope.graphOptions = {};

    if ($routeParams.id)
      $scope.expand[$routeParams.id] = true;

    // called when a deployment is clicked
    this.toggleExpand = function (deployment) {
      $scope.expand[deployment.id] = !$scope.expand[deployment.id];

      if ($scope.expand[deployment.id]) {
        /*api("/api/v2/node_roles/graph?deployment_id="+deployment.id).
          success(function (obj) {
            var parsedData = vis.network.convertDot(obj["string"]);
            $scope.graphData[deployment.id] = {
              nodes: parsedData.nodes,
              edges: parsedData.edges
            };
            $scope.graphOptions[deployment.id] = parsedData.options;
            $scope.graphOptions[deployment.id] = {

              layout: {
                hierarchical: {
                  enabled:true,
                  levelSeparation: 150,
                  direction: 'UD',        // UD, DU, LR, RL
                  sortMethod: 'directed'   // hubsize, directed
                }
              }

            };
          }).
          error(function (err) {
            api.toast("Error Getting Graph Data", 'node_role', err);
          });*/
      }
    };

    // used to prevent lots of watchers from being called when creating a list of nodes
    $scope.getNodeIds = function (deployment_id) {
      var nodes = [];

      for (var i in $scope._nodes) {
        var node = $scope._nodes[i];
        if (node.deployment_id == deployment_id && !node.system)
          nodes.push(i);
      }
      nodes.sort(function(a, b){
        return $scope._nodes[a].name.localeCompare($scope._nodes[b].name);
      });
      return nodes;
    };

    $scope.assignDeploymentToTenant = function (deployment_id, tenant_id) {
      api("/api/v2/deployments/" + deployment_id, {
        method: "PUT",
        data: {
          tenant_id: tenant_id
        }
      }).success(api.addDeployment);
    };

    // used to prevent lots of watchers from being called when creating a list of nodes
    $scope.getDeploymentRoleIds = function (deployment_id) {
      var roles = [];
      for (var i in $scope._deployment_roles) {
        var role = $scope._deployment_roles[i];
        if (role.deployment_id == deployment_id)
          roles.push(i);
      }
      roles.sort(function(a, b){
        var rac = 0;
        var rbc = 0;

        if (typeof a != 'undefined') {
          var dra = $scope._deployment_roles[a];
          if (typeof dra != 'undefined') {
            var ra = $scope._roles[dra.role_id];
            if (typeof ra != 'undefined') {
              rac = ra.cohort
            }
          }
        }

        if (typeof b != 'undefined') {
          var drb = $scope._deployment_roles[b];
            if (typeof drb != 'undefined') {
              var rb = $scope._roles[drb.role_id];
              if (typeof rb != 'undefined') {
                rbc = rb.cohort
              }
            }
          }

        return rac - rbc;
      });
      return roles;
    };

    $scope.getNodeRoleIds = function (deployment_id) {
      if(typeof $scope.phantoms[deployment_id] === "undefined")
        return [];
      var roles = [];
      for(var i in $scope._node_roles) {
        var role = $scope._node_roles[i];
        if(role.node_id == $scope.phantoms[deployment_id].id)
          roles.push(i);
      }
      roles.sort(function(a, b){
        var rac = 0;
        var rbc = 0;

        if (typeof a != 'undefined') {
          var dra = $scope._node_roles[a];
          if (typeof dra != 'undefined') {
            var ra = $scope._roles[dra.role_id];
            if (typeof ra != 'undefined') {
              rac = ra.cohort
            }
          }
        }

        if (typeof b != 'undefined') {
          var drb = $scope._node_roles[b];
            if (typeof drb != 'undefined') {
              var rb = $scope._roles[drb.role_id];
              if (typeof rb != 'undefined') {
                rbc = rb.cohort
              }
            }
          }

        return rac - rbc;
      });
      return roles;

    };

    // makes a map of node simpleState => number of nodes with that simpleState
    this.getNodeCounts = function (deployment, override) {
      var result = [0, 0, 0, 0];

      for (var i in $scope._nodes) {
        var node = $scope._nodes[i];
        if (node.deployment_id == deployment.id && !node.system)
          result[node.simpleState]++;
      }
      return result;
    };

    this.opts = { // sparkline options
      sliceColors: [
        "#8BC34A", // ready
        "#F44336", // error
        "#03A9F4", // todo
        "#616161" // off
      ],
      tooltipFormat: '{{value}}',
      disableTooltips: true,
      disableHighlight: true,
      borderWidth: 2,
      borderColor: '#fff',
      fillColor: '#fff',
      width: '2em',
      height: '2em'
    };

    this.deploymentPie = {};

    // creates the pie chart data for all the deployments
    this.createPieChartData = function () {
      $timeout(function () {
        for (var id in $scope._deployments) {
          $scope.updateMatrix($scope._deployments[id]);
          deployments.deploymentPie[id] = deployments.getNodeCounts($scope._deployments[id]);
        }
      }, 500);
    };

    this.deploymentStatus = {};
    $scope.deploymentStates = {
      '-1': 'error', // error
      '0': 'reserved', // proposed
      '1': 'todo', // committed
      '2': 'ready' // active
    };
    $scope.deploymentStateNames = {
      '-1': 'error',
      '0': 'proposed',
      '1': 'committed',
      '2': 'active'
    };
    $scope.deploymentIcons = {
      'error': 'warning', // error
      'reserved': 'playlist_add', // proposed
      'todo': 'playlist_play', // committed
      'ready': 'playlist_add_check' // active
    };

    // creates the node role status data for all the deployments
    // takes a sum of the all the node roles and all the errors
    this.createStatusBarData = function () {
      $scope.$evalAsync(function () {
        for (var id in $scope._deployments) {
          if (!$scope.binding[id])
            $scope.binding = false;
          deployments.deploymentStatus[id] = { error: 0, total: 0 }
          for (var roleId in $scope._node_roles) {
            var node_role = $scope._node_roles[roleId];
            if (node_role.deployment_id != id)
              continue;

            var state = node_role.state;
            if (state == -1)
              deployments.deploymentStatus[id].error++;
            deployments.deploymentStatus[id].total++;
          }
        }
      });
    };

    // creates a confirmation dialog before redeploying the deployment
    $scope.redeployDeployment = function (event, id) {
      $scope.confirm(event, {
        title: "Redeploy All Nodes in Deployment",
        message: "Are you sure you want to redeploy " + $scope._deployments[id].name + "?",
        yesCallback: function () {
          api("/api/v2/deployments/" + id + "/redeploy", { method: "PUT" }).
          success(function () {
            $scope.updateMatrix($scope._deployments[id]);
          }).
          error(function (err) {
            api.toast("Error Redeploying Deployment", 'deployment', err);
          })
        }
      });
    };

    // creates a confirmation dialog before deleting the deployment
    $scope.deleteDeployment = function (event, id) {
      $scope.confirm(event, {
        title: "Delete Deployment",
        message: "Are you sure you want to delete deployment " + $scope._deployments[id].name + "?",
        yesCallback: function () {
          api("/api/v2/deployments/" + id, { method: "DELETE" }).
          success(function () {
            api.remove("deployment", id);
          }).
          error(function (err) {
            api.toast("Error Deleting Deployment", 'deployment', err);
          })
        }
      });
    };

    // puts deployment into proposed status
    $scope.proposeDeployment = function (id) {
      if ($scope._deployments[id].name === 'system')
        $scope.confirm(event, {
          title: "WARNING: Proposing System Deployment",
          message: "Proposing the System Deployment may pause core functions. Continue?",
          yesCallback: function() { $scope.proposeDeploymentNoCheck(id) }
        });
      else $scope.proposeDeploymentNoCheck(id);
    };

    // puts deployment into proposed status
    $scope.proposeDeploymentNoCheck = function (id) {
      api("/api/v2/deployments/" + id + "/propose", { method: "PUT" }).
      success(api.addDeployment).
      error(function (err) {
        api.toast("Error Proposing Deployment " + $scope._deployments[id].name, 'deployment', err);
      });
    };

    // puts deployment into committed status
    $scope.commitDeployment = function (id) {
      api("/api/v2/deployments/" + id + "/commit", { method: "PUT" }).
      success(api.addDeployment).
      error(function () {
        api.toast("Error Committing Deployment " + $scope._deployments[id].name, 'deployment', err);
      });
    };

    // creates an array of unused roles for a specified deployment
    $scope.getRoles = function (deployment_id) {
      var roles = [];
      var active = [];
      for (var id in $scope._deployment_roles) {
        var deployment_role = $scope._deployment_roles[id];
        if (deployment_role.deployment_id == deployment_id) {
          active.push(deployment_role.role_id + "");
        }
      }
      for (var id in $scope._roles) {
        if (active.indexOf(id) == -1) {
          roles.push($scope._roles[id]);
        }
      }
      return roles;
    };

    // adds a role to the deployment
    $scope.addRole = function (role_id, id) {
      api("/api/v2/deployment_roles/", {
        method: "POST",
        data: {
          deployment_id: id,
          add_role: {
            role_id: role_id
          }
        }
      }).success(api.addDeploymentRole).
      error(function (err) {
        api.toast("Error Adding Deployment Role", 'deployment_role', err);
      });
    };


    $scope.createDeploymentPrompt = function (ev) {
      var confirm = $mdDialog.prompt()
        .title('Create Deployment')
        .textContent('Enter the Name of the New Deployment')
        .placeholder('Deployment Name')
        .targetEvent(ev)
        .ok('Create')
        .cancel('Cancel');
      $mdDialog.show(confirm).then(function (name) {
        api('/api/v2/deployments', {
          method: "POST",
          data: {
            name: name
          }
        }).success(api.addDeployment).
        success(function () {
          deployments.createPieChartData();
          deployments.createStatusBarData();
        }).
        error(function (err) {
          api.toast("Couldn't Create Deployment", 'deployment', err);
        });
      }, function () {});
    };

    $scope.matrix = {};
    $scope.matrix_order = {};
    $scope.phantoms = {};
    $scope.updateMatrix = function (deployment) {
      for (var i in $scope._nodes) {
        var node = $scope._nodes[i];
        if(node.variant === 'phantom' && node.deployment_id === deployment.id) {
          $scope.phantoms[deployment.id] = node;
          break;
        }
      }
      var roles = {};
      var node_roles = $filter('from')($scope._node_roles, 'deployment', deployment);
      var deployment_roles = $filter('from')($scope._deployment_roles, 'deployment', deployment);
      var roleToDeploymentRole = {};
      for (var i in deployment_roles)
        roleToDeploymentRole[deployment_roles[i].role_id] = deployment_roles[i].id;
      for (var i = 0; i < node_roles.length; i++) {
        var role = node_roles[i];
        var node = $scope._nodes[role.node_id];
        if (node && node.system) {
          node_roles.splice(i--, 1);
        }
        else {
          var id = roleToDeploymentRole[role.role_id];
          roles[id] = roles[id] || {};
          roles[id][role.node_id] = role.id;
        }
      }
      var keys = Object.keys(roles);
      keys.sort(function(a, b) {
        var rac = 0;
        var rbc = 0;

        if (typeof a != 'undefined') {
          var dra = $scope._deployment_roles[a];
          if (typeof dra != 'undefined') {
            var ra = $scope._roles[dra.role_id];
            if (typeof ra != 'undefined') {
              rac = ra.cohort
            }
          }
        }

        if (typeof b != 'undefined') {
          var drb = $scope._deployment_roles[b];
          if (typeof drb != 'undefined') {
            var rb = $scope._roles[drb.role_id];
            if (typeof rb != 'undefined') {
              rbc = rb.cohort
            }
          }
        }

        return rac - rbc;
      });
      $scope.matrix_order[deployment.id] = keys;
      $scope.matrix[deployment.id] = roles;
    }

    // create an object that links node roles to nodes with the deployment and parent role
    $scope.setBindRole = function (deployment_id, role_id) {
      $scope.bindRoles[deployment_id] = {
        role_id: role_id,
        roles: {}
      };

      // find all node roles with the same role and deployment and link them to their nodes
      for (var id in $scope._node_roles) {
        var node_role = $scope._node_roles[id];
        if (node_role.role_id == role_id && node_role.deployment_id == deployment_id)
          $scope.bindRoles[deployment_id].roles[node_role.node_id] = node_role;
      }
    };

    $scope.matrixUpdateLoop = function () {
      for (var id in $scope._deployments) {
        $scope.updateMatrix($scope._deployments[id]);
      }

      $timeout.cancel($scope.updateInterval);
      $scope.updateInterval = $timeout($scope.matrixUpdateLoop, 2000);

    };

    $scope.matrixUpdateLoop();

    $scope.$on('$routeChangeStart', function () {
      $timeout.cancel($scope.updateInterval);
    });

    // binds a node role to the deployment, role, and node
    $scope.bindNodeRole = function (deployment_id, role_id, node_id) {
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
      }).success(function () {
        $scope.setBindRole(deployment_id, role_id);
      });
    };

    // destroy a node role
    $scope.destroyNodeRole = function (node_role_id) {
      var node_role = $scope._node_roles[node_role_id];
      var deployment_id = node_role.deployment_id;
      var role_id = node_role.role_id;
      $scope.confirm(event, {
        title: "Destroy Node Role",
        message: "Are you sure you want to destroy this node role?",
        yesCallback: function () {
          api('/api/v2/node_roles/' + node_role_id, {
            method: 'DELETE'
          }).success(function () {
            api.remove('node_role', node_role_id);
            $scope.setBindRole(deployment_id, role_id);
          });
        }
      });
    };

    $scope.bindRoles = {};
    $scope.binding = {};

    // callbacks for when nodes and noderoles finish
    // the pie charts require the nodes to exist
    $scope.$on('nodesDone', deployments.createPieChartData);
    $scope.$on('node_rolesDone', deployments.createStatusBarData);

    // if we have nodes, we don't have to wait for the callback
    if (Object.keys($scope._nodes).length)
      this.createPieChartData();

    if (Object.keys($scope._node_roles).length)
      this.createStatusBarData();

  });

})();
