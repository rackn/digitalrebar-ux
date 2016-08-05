/*
workloads controller
*/
(function () {
  angular.module('app')
    .controller('WorkloadsCtrl', function ($scope, api, $location, $mdDialog, $routeParams) {
      $scope.$emit('title', 'Wizard'); // shows up on the top toolbar

      var workloads = this;
      this.deployment_id = -1;
      this.add_os = 'default_os';
      this.required_service = '';
      this.selected = [];
      this.attribs = {};

      $scope.done = 0;
      $scope.status = 0;
      $scope.steps = [
        {
          name: "Deployment",
          path: "views/wizard/deployment.html",
          icon: "directions_bike",
          complete: function () {
            var deployment = $scope._deployments[workloads.deployment_id];
            // no deployment selected
            if (!deployment)
              return false;

            // deployment isn't proposed
            if (deployment.state != 0)
              return false;

            return true;
          }
        },
        {
          name: "OS",
          path: "views/wizard/os.html",
          icon: "directions_car",
          complete: function () {
            // no metal os selected
            if (wizard.os && wizard.system_nodes && !workloads.os)
              return false;

            // no cloud os selected
            if (wizard.os && wizard.create_nodes && !workloads.add_os)
              return false;

            // no provider given
            if (wizard.create_nodes && !workloads.provider)
              return false;

            return true;
          }
        },
        {
          name: "Attributes",
          path: "views/wizard/attributes.html",
          icon: "directions_bus",
          complete: function () {
            return true;
          }
        },
        {
          name: "Nodes",
          path: "views/wizard/nodes.html",
          icon: "directions_boat",
          complete: function (output) {
            if (workloads.selected.length == 0)
              return output ? [false, 'You must select at least one node'] : false;

            var cluster = 0;
            var hasCluster = false;
            for (var i in workloads.selected) {
              var canHaveRequired = false;
              var hasRequired = false;
              var node = workloads.selected[i];
              for(var j in wizard.services) {
                var service = wizard.services[j];
                var hasService = serviceMap[node.id][service.name];
                if (service.type == 'cluster')
                  hasCluster = true;
                if (service.type == 'required')
                  canHaveRequired = true;

                if (hasService && service.type == 'required')
                  hasRequired = true;

                if (hasService && service.type == 'cluster') {
                  cluster ++;
                }
              }
              if(!hasRequired && canHaveRequired)
                return output ? [false, 'Every node must have a Required Service'] : false;
            }


            if (cluster % 2 != 1 && hasCluster)
              return output ? [false, 'An Odd Number of Cluster Services is Required'] : false;

            return output ? [true, ''] : true;
          }
        },
        {
          name: "Overview",
          path: "views/wizard/overview.html",
          icon: "airplanemode_active",
        },
      ];

      $scope.setProgress = function (status) {
        if(status <= $scope.status)
          $scope.done = status;
      };

      $scope.canNext = false;
      $scope.setCanNext = function () {
        $scope.canNext = true;
      }

      $scope.nextStep = function () {
        if ($scope.status > $scope.done) {
          $scope.done ++;
          $scope.canNext = false;
        }
        else if ($scope.status == $scope.done) {
          if ($scope.steps[$scope.done].complete()) {
            $scope.done ++;
            $scope.status ++;
            $scope.canNext = false;
          }
        }
      }

      $scope.prevStep = function () {
        if ($scope.done > 0)
          $scope.done --;
      }

      $scope.getDeployments = function () {
        var deployments = [];
        for (var i in $scope._deployments) {
          var deployment = $scope._deployments[i];
          if (deployment.system)
            continue;

          deployments.push(deployment);
        }
        return deployments;
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
          success(function (obj) {
            workloads.deployment_id = obj.id;
          }).
          error(function (err) {
            api.toast("Couldn't Create Deployment", 'deployment', err);
          });
        }, function () {});
      };

      for (var i in $scope._providers) {
        var provider = $scope._providers[i];
        if (provider.type === 'MetalProvider' || provider.type == '') {
          continue;
        }
        this.provider = provider.name;
        break;
      }

      /*if (this.provider === '' && Object.keys($scope._providers).length) {
        $scope.confirm(undefined, {
          title: "Redirect to Providers",
          message: "You have no providers! Would you like to go to the providers page?",
          yesCallback: function () {
            $scope.setPath("/providers")
          }
        });
      }*/

      $scope.showAdvanced = false;
      $scope.toggleAdvanced = function () {
        $scope.showAdvanced = !$scope.showAdvanced;
      };

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

      api('/api/v2/nodes/system-phantom.internal.local/attribs/provisioner-available-oses').
      success(function (data) {
        if (data.value) {
          $scope.osList = Object.keys(data.value);
          if ($scope.osList.length)
            workloads.os = $scope.osList[0];
        }
      });

      $scope.attribMap = {};
      api('/api/v2/attribs').
      success(function (data) {
        for(var i in data) {
          var attrib = data[i];
          $scope.attribMap[attrib.name] = attrib;
        }
        
        for (var i in wizard.base_attribs) {
          var attrib = wizard.base_attribs[i]
          workloads.attribs[attrib] = $scope.attribMap[attrib].default.value;
        }

        for (var i in wizard.advanced_attribs) {
          var attrib = wizard.advanced_attribs[i]
          workloads.attribs[attrib] = $scope.attribMap[attrib].default.value;
        }
      }).error(function (err) {
        api.toast('Error fetching Attribs', 'attribs', err);
      });

      $scope.roles = [];
      $scope.roleMap = {};
      var serviceMap = $scope.serviceMap = {};
      for (var id in $scope._roles) {
        var role = $scope._roles[id];
        $scope.roleMap[role.name] = role;
        /*if (serviceList.includes(role.name)) {
          $scope.roles.push(role);
        }*/
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
          name: "Virtual Node " + (-id),
          count: 1,
        };

        serviceMap[node.id] = {};
        var req = false;
        for (var i in wizard.services) {
          var service = wizard.services[i];
          serviceMap[node.id][service.name] = service.type == 'required' && !req;
          if (service.type == 'required')
            req = true;
        }

        workloads.selected.push(node);
        $scope.createdNodes.push(node);
        return node;
      };

      // create new nodes if system nodes aren't allowed
      if (!wizard.system_nodes && wizard.create_nodes) {
        var numCluster = 0;
        var numWorker = 0;
        var clusters = {};
        var workers = {};
        // get the max count for worker and cluster roles
        for (var i = 0; i < wizard.services.length; i++) {
          var service = wizard.services[i];

          // add services to the keys of designated objects
          if (service.type == 'cluster')
            clusters[service.name] = 1;
          else if (service.type == 'worker')
            workers[service.name] = 1;

          if (service.count > 0) {
            if (service.type == 'cluster' && service.count > numCluster)
              numCluster = service.count;
            else if (service.type == 'worker' && service.count > numWorker)
              numWorker = service.count;
          }
        }
        // create the number of virtual nodes
        for (var i = 0; i < numCluster + numWorker; i++) {
          var node = $scope.addNode();
          if (i < numCluster) {
            for (var j in clusters)
              serviceMap[node.id][j] = true;
          } else {
            for (var j in workers)
              serviceMap[node.id][j] = true;
          }
        }
      }

      $scope.select = function (node, service) {
        var state = serviceMap[node.id][service.name];
        switch (service.type) {
        case 'required': // functions as a radio: only one at a time
          if (state)
            return;
          for(var i in serviceMap[node.id]) {
            var s;
            for(var j in wizard.services) {
              if (wizard.services[j].name === i) {
                s = wizard.services[j];
                break;
              }
            }
            if(s && s.type == 'required')
              serviceMap[node.id][i] = false;
          }
          serviceMap[node.id][service.name] = true;
          break;

        case 'cluster': // functions like optional, but disables worker
          if (!state) {
            for(var i in serviceMap[node.id]) {
              var s;
              for(var j in wizard.services) {
                if (wizard.services[j].name === i) {
                  s = wizard.services[j];
                  break;
                }
              }
              if(s.type == 'worker')
                serviceMap[node.id][i] = false;
            }
            serviceMap[node.id][service.name] = true;            
          } else {
            serviceMap[node.id][service.name] = false;
          }
          break;

        case 'worker': // functions like optional, but disables cluster
          if (!state) {
            for(var i in serviceMap[node.id]) {
              var s;
              for(var j in wizard.services) {
                if (wizard.services[j].name === i) {
                  s = wizard.services[j];
                  break;
                }
              }
              if(s.type == 'cluster')
                serviceMap[node.id][i] = false;
            }
            serviceMap[node.id][service.name] = true;            
          } else {
            serviceMap[node.id][service.name] = false;
          }
          break;

        default:
          serviceMap[node.id][service.name] = !serviceMap[node.id][service.name];
          break;
        }
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

            var isMetal = $scope._providers[node.provider_id].type == 'MetalProvider';

            if (isMetal && !wizard.system_nodes)
              return;

            if (!isMetal && !wizard.create_nodes)
              return;


            if (!serviceMap[node.id]) {
              serviceMap[node.id] = {};
              for (var i in wizard.services) {
                var service = wizard.services[i]
                serviceMap[node.id][service] = false;
              }
            }
            nodes.push(node);
          });
        }
        return nodes.concat($scope.createdNodes);
      };

    });
})();
