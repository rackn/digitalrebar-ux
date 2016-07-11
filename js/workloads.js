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

      $scope.generateBlob = function () {
        var data = {
          name: workloads.name,
          os: workloads.os
        };

        if (wizard.create_nodes) {
          data.provider = {
            name: provider.name,
            os: workloads.add_os
          };
        }

        var virtualNodes = 0;
        data.nodes = [];

        for (var i in workloads.selected) {
          var node = workloads.selected[i];
          var id = node.id;
          var roles = [];

          for (var role in serviceMap[id]) {
            if (serviceMap[id][role])
              roles.push($scope.roleMap[role].id);
          }

          roles = roles.sort();

          if (id > 0) {
            data.nodes.push({
              node_id: id,
              roles: roles
            });
          } else {
            var existing = false;
            // check to see if we already have a cloud node with the same roles
            for (var j in data.nodes) {
              var n = data.nodes[j];
              if (n.id > 0)
                continue;
              // unfortunately the only way to compare arrays
              if (JSON.stringify(n.roles) == JSON.stringify(roles)) {
                n.node_count++;
                existing = true;
                break;
              }
            }

            if (!existing) {
              console.log("Adding virtual node",virtualNodes+1)
              data.nodes.push({
                node_id: -(++virtualNodes),
                roles: roles,
                node_count: 1
              });
            }
          }

        }

        console.log(JSON.stringify(data, null, "  "))
      };

    });
})();
