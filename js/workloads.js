/*
workloads controller
*/
(function () {
  angular.module('app')
    .controller('WorkloadsCtrl', function ($scope, api, $location, $routeParams) {
      $scope.$emit('title', 'Wizard'); // shows up on the top toolbar

      var workloads = this;
      this.selected = [];
      this.provider = '';
      this.os = '';

      $scope.terms = {
        all: "All Nodes Need This",
      }

      for (var i in $scope._providers) {
        var provider = $scope._providers[i];
        if (provider.type === 'MetalProvider' || provider.type == '') {
          continue;
        }
        this.provider = provider.name;
        break;
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

      $scope.roles = [];
      var serviceMap = $scope.serviceMap = {};
      var serviceList = Object.keys(wizard.services);
      for (var id in $scope._roles) {
        var role = $scope._roles[id];
        if (serviceList.includes(role.name)) {
          $scope.roles.push(role);
        }
      }

      $scope.tryDeselect = function (node) {
        if (node.id < 0) { // remove node that hasn't been created
          $scope.createdNodes.splice($scope.createdNodes.indexOf(node), 1);
          delete serviceMap[node.id];
          return;
        }

        for (var i in serviceMap[node.id]) {
          if (serviceMap[node.id][i]) {
            workloads.selected.push(node);
            return;
          }
        }
      };

      $scope.newId = -1;
      $scope.createdNodes = [];

      $scope.addNode = function () {
        if (!wizard.create_nodes)
          return;

        var id = $scope.newId--;
        var node = {
          id: id,
          name: "Virtual Node " + (-id)
        };
        serviceMap[node.id] = {};
        for (var i in serviceList) {
          serviceMap[node.id][serviceList[i]] = false;
        }
        workloads.selected.push(node);
        $scope.createdNodes.push(node)
      };

      // create nodes if system nodes aren't allowed
      if (!wizard.system_nodes && wizard.create_nodes) {
        for (var i = 0; i < serviceList.length; i++) {
          $scope.addNode();
        }
      }

      $scope.select = function (node, service) {
        serviceMap[node.id][service.name] = !serviceMap[node.id][service.name];
        if (!workloads.selected.includes(node)) {
          workloads.selected.push(node);
        }
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
                serviceMap[node.id][serviceList[i]] = false;
              }
            }
            nodes.push(node);
          });
        }
        return nodes.concat($scope.createdNodes);
      };

    });
})();
