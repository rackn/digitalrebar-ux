/*
workloads controller
*/
(function () {
  angular.module('app')
    .controller('WorkloadsCtrl', function ($scope, api, $location, $mdDialog, $routeParams) {
      $scope.$emit('title', 'Wizard'); // shows up on the top toolbar

      var workloads = this;
      this.selected = [];
      this.provider = '';
      this.os = ''; // metal os
      this.add_os = 'default_os'; // provider os

      $scope.terms = {
        all: "Every node",
        odd: "Odd number of nodes",
        optional: "Optional",
        exclusive: "Node has only this service"
      }

      for (var i in $scope._providers) {
        var provider = $scope._providers[i];
        if (provider.type === 'MetalProvider' || provider.type == '') {
          continue;
        }
        this.provider = provider.name;
        break;
      }

      if (this.provider === '' && Object.keys($scope._providers).length) {
        $scope.confirm(undefined, {
          title: "Redirect to Providers",
          message: "You have no providers! Would you like to go to the providers page?",
          yesCallback: function () {
            $scope.setPath("/providers")
          }
        });
      }



      var id = $routeParams.id;

      // only accept barclamps that are ... barclamps and wizard capable
      if (typeof $scope._barclamps[id] === 'undefined' ||
        typeof $scope._barclamps[id].cfg_data.wizard === 'undefined') {
        $scope.setPath('/deployments')
        return;
      }

      var barclamp = $scope.barclamp = $scope._barclamps[id];
      var wizard = $scope.wizard = barclamp.cfg_data.wizard;
      $scope.$emit('title', wizard.name + ' Wizard');

      this.name = barclamp.cfg_data.barclamp.name;

      $scope.osList = [];

      // get a list of operating systems that are available
      // and supported by this barclamp
      //if (barclamp.cfg_data.barclamp.os_support) {
      api('/api/v2/nodes/system-phantom.internal.local/attribs/provisioner-available-oses').
      success(function (data) {
        /*var supported = barclamp.cfg_data.barclamp.os_support;
        console.log(data.value, supported)
        for (var os in data.value) {
          if (supported.includes(os) && data.value[os]) {
            $scope.osList.push(os);

            if (!workloads.os)
              workloads.os = os;
          }
        }*/
        if (data.value) {
          $scope.osList = Object.keys(data.value);
          if ($scope.osList.length)
            workloads.os = $scope.osList[0];
        }
      });
      //}

      $scope.roles = [];
      $scope.roleMap = {};
      var serviceMap = $scope.serviceMap = {};
      var serviceList = Object.keys(wizard.services);
      for (var id in $scope._roles) {
        var role = $scope._roles[id];
        if (serviceList.includes(role.name)) {
          $scope.roles.push(role);
          $scope.roleMap[role.name] = role;
        }
      }

      $scope.tryDeselect = function (node) {
        if (node.id < 0) { // remove node that hasn't been created
          $scope.createdNodes.splice($scope.createdNodes.indexOf(node), 1);
          delete serviceMap[node.id];
          return;
        }

        // remove the services from this node
        for (var i in serviceMap[node.id]) {
          if (serviceMap[node.id][i]) {
            serviceMap[node.id][i] = false;
          }
        }
      };

      $scope.newId = -1;
      $scope.createdNodes = [];

      $scope.addNode = function () {
        if (!wizard.create_nodes)
          return;

        // negative ids so we know to create a new node
        var id = $scope.newId--;
        var node = {
          id: id,
          name: "Virtual Node " + (-id)
        };

        serviceMap[node.id] = {};
        for (var i in serviceList) {
          var service = serviceList[i]
          serviceMap[node.id][service] = false;
        }

        workloads.selected.push(node);
        $scope.createdNodes.push(node);
        return node;
      };

      // create new nodes if system nodes aren't allowed
      if (!wizard.system_nodes && wizard.create_nodes) {
        for (var i = 0; i < serviceList.length; i++) {
          var node = $scope.addNode();
        }
      }

      $scope.select = function (node, service) {
        serviceMap[node.id][service.name] = !serviceMap[node.id][service.name];
        if (!workloads.selected.includes(node)) {
          workloads.selected.push(node);
        }
      };

      $scope.overallStatus = function () {
        if (!workloads.os.length && wizard.os)
          return false;

        if (workloads.selected.length == 0)
          return false;

        for (var i in serviceList) {
          if (!$scope.getStatus(serviceList[i]))
            return false;
        }
        return true;
      };

      $scope.getStatus = function (service) {
        var req = wizard.services[service];
        var count = 0;
        for (var i in workloads.selected) {
          var node = workloads.selected[i];
          if (serviceMap[node.id][service])
            count++;
        }

        switch (req) {
        case 'all':
          count = 0;

          // all nodes except exclusive
          for (var i in workloads.selected) {
            var node = workloads.selected[i];
            var exclusive = false;
            for (var name in serviceMap[node.id]) {
              if (serviceMap[node.id][name] && wizard.services[name] == 'exclusive') {
                exclusive = true;
                break;
              }
            }
            if (serviceMap[node.id][service] || exclusive)
              count++;
          }
          return count == workloads.selected.length && workloads.selected.length > 0;
        case 'odd':
          return count % 2 == 1;
        case 'optional':
          return workloads.selected.length > 0;
        case 'exclusive':
          for (var i in workloads.selected) {
            var node = workloads.selected[i];
            if (serviceMap[node.id][service])
              for (var name in serviceMap[node.id]) {
                if (name !== service && serviceMap[node.id][name])
                  return false;
              }
          }
          return true;
        }
        return false;
      };

      $scope.getNodes = function () {
        var nodes = [];
        if (wizard.system_nodes) {
          var system_id = 1;
          for (var i in $scope._deployments) {
            var deployment = $scope._deployments[i];
            if (deployment.system) {
              system_id = i;
              break;
            }
          }

          Object.keys($scope._nodes).forEach(function (id) {
            var node = $scope._nodes[id];
            if (node.system)
              return;

            // node isn't in system deployment
            if (node.deployment_id != system_id)
              return;

            if (!serviceMap[node.id]) {
              serviceMap[node.id] = {};
              for (var i in serviceList) {
                var service = serviceList[i]
                serviceMap[node.id][service] = false;
              }
            }
            nodes.push(node);
          });
        }
        return nodes.concat($scope.createdNodes);
      };

      $scope.wizardStatus = 0;
      $scope.startWizard = function () {
        console.log("Starting wizard")
        if (!$scope.overallStatus())
          return;

        $scope.wizardStatus = 1;
        /* create deployment
         * move nodes
         * create nodes
         * bind nodes
         */
        var deployment_id = -1;

        var createDeployment = function () {
          console.log("creating deployments")
          api('/api/v2/deployments', {
            method: "POST",
            data: {
              name: workloads.name
            }
          }).success(api.addDeployment).success(function (data) {
            deployment_id = data.id;
            $scope.wizardStatus = 2;
            moveNodes();
          }).error(function(e){console.log("failed on createDeployment",e)});
        };

        var moveNodes = function () {
          console.log("Moving nodes")

          var realNodes = []
          for (var i in workloads.selected) {
            var node = workloads.selected[i];
            if (node.id > 0) {
              realNodes.push(node);
              console.log('adding',node.id)
            }
          }
          var count = realNodes.length;
          console.log('moving',count,'nodes')
          var part = 1 / count;
          realNodes.forEach(function (node) {
            api("/api/v2/nodes/" + node.id, {
              method: "PUT",
              data: {
                node_deployment: {
                  deployment_id: deployment_id,
                  old_deployment: node.deployment_id
                }
              }
            }).success(api.addNode).success(function () {
              $scope.wizardStatus += part;
              count--;
              if (count == 0) {
                $scope.wizardStatus = 3;
                createNodes();
              }
            }).error(function(e){console.log("failed on moveNode",e)});
          });
          if(count == 0) {
            console.log('no nodes to move, creating nodes')
            $scope.wizardStatus = 3;
            createNodes();
          }
        };

        var createNodes = function () {
          console.log("Creating Nodes")
          for (var i in $scope.createdNodes) {
            $scope.createdNodes[i].index = i;
          }
          var count = $scope.createdNodes.length;
          var part = 1 / count;
          $scope.createdNodes.forEach(function (node) {
            var i = node.index;
            var payload = {
              'name': workloads.name + "-" + i + "." + workloads.provider + ".neode.org",
              'description': "created by rebar",
              'provider': workloads.provider,
              'deployment_id': deployment_id,
              'hints': {
                'use-proxy': false,
                'use-ntp': false,
                'use-dns': false,
                'use-logging': false,
                'provider-create-hint': {
                  'hostname': workloads.name + '-' + i
                }
              }
            };
            if (workloads.add_os != "default_os") {
              // packet
              payload.hints['provider-create-hint'].os = workloads.add_os;
              // aws
              payload.hints['provider-create-hint'].image_id = workloads.add_os;
              // google
              payload.hints['provider-create-hint'].disks = [];
              payload.hints['provider-create-hint'].disks.push({
                'autoDelete': true,
                'boot': true,
                'type': 'PERSISTENT',
                'initializeParams': {
                  'sourceImage': workloads.add_os
                }
              });
            };


            api('/api/v2/nodes', {
              method: "POST",
              data: payload,
            }).success(api.addNode).success(function (data) {
              node.real_node = data.id;
              $scope.wizardStatus += part;
              count--;
              if (count == 0) {
                $scope.wizardStatus = 4;
                bindNodes();
              }
            }).error(function(e){console.log("failed on createNodes",e)});
          });
          if(count == 0) {
            console.log('no nodes to create, binding')
            $scope.wizardStatus = 4;
            createNodes();
          }
        };

        var bindNodes = function () {
          console.log("Binding Nodes")
          var count = 0;
          for (var i in serviceMap) {
            for (var j in serviceMap[i]) {
              if (serviceMap[i][j])
                count++;
            }
          }
          var part = 1 / count;
          workloads.selected.forEach(function (node) {
            var node_id = node.id < 0 ? node.real_node : node.id;
            for (var roleName in serviceMap[node.id]) {
              if (serviceMap[node.id][roleName]) {
                var role_id = $scope.roleMap[roleName].id;
                api("/api/v2/node_roles/", {
                  method: "POST",
                  data: {
                    node_id: node_id,
                    deployment_id: deployment_id,
                    role_id: role_id
                  }
                }).success(api.addNodeRole).success(function () {
                  $scope.wizardStatus += part;
                  count--;
                  if (count == 0) {
                    $scope.wizardStatus = 5;
                    finishWizard();
                  }
                }).error(function(e){console.log("failed on bindNodes",e)});
              }
            }
          });
        };

        var finishWizard = function () {
          console.log("Done!");
        }

        createDeployment();

      };

    });
})();
