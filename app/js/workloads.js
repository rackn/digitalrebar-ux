/*
workloads controller
*/
(function () {
  angular.module('app')
    .controller('WorkloadsCtrl', function ($scope, api, $location, $mdDialog, $routeParams, localStorageService) {
      $scope.$emit('title', 'Wizard'); // shows up on the top toolbar

      var workloads = this;
      this.required_service = '';
      this.commit = true;
      this.deployment_id = 0;
      this.source = 'system';
      this.createDeployment = true;
      this.use_system = false;
      this.selected = [];
      this.attribs = {};
      this.keys = [ ["", ""]];

      $scope.submitStatus = 0;

      $scope.done = 0;
      $scope.status = 0;
      $scope.steps = [{
        name: "Deployment",
        path: "views/wizard/deployment.html",
        icon: "directions_run",
        complete: function () {
          // deployment logic
          if (workloads.createDeployment) {
            // no deployment selected
            var deployment = workloads.name;
            if (!deployment)
              return false;
          } else {
            var deployment = $scope._deployments[workloads.deployment_id];
            // no deployment selected
            if (!deployment)
              return false;
          }
          // set use system based on wizard
          workloads.use_system = !wizard.create_nodes;
          return true;
        }
      }, {
        name: "OS",
        path: "views/wizard/os.html",
        icon: "directions_bike",
        complete: function () {
          // no metal os selected
          var metal = (wizard.system_nodes && workloads.attribs["provisioner-target_os"] && workloads.use_system);
          // no providers selected
          var cloud = (wizard.create_nodes && workloads.provider);
          return metal || cloud;
        }
      }, {
        name: "Attributes",
        path: "views/wizard/attributes.html",
        icon: "directions_car",
        complete: function () {
          $scope.collectNodes();
          return true;
        }
      }, {
        name: "Nodes",
        path: "views/wizard/nodes.html",
        icon: "directions_train",
        complete: function (output) {
          if (workloads.selected.length == 0)
            return output ? [false, 'You must select at least one node'] : false;

          var control = {};
          var hasControl = {};
          for (var j in wizard.services) {
            var service = wizard.services[j];
            control[service.name] = 0;
            hasControl[service.name] = false;
          }
          for (var i in workloads.selected) {
            var canHaveRequired = false;
            var hasRequired = false;
            var node = workloads.selected[i];
            for (var j in wizard.services) {
              var service = wizard.services[j];
              var hasService = serviceMap[node.id][service.name];
              if (service.type == 'control')
                hasControl[service.name] = true;

              if (service.type == 'required')
                canHaveRequired = true;

              if (hasService && service.type == 'required')
                hasRequired = true;

              if (hasService && service.type == 'control') {
                control[service.name]++;
              }
            }
            if (!hasRequired && canHaveRequired)
              return output ? [false, 'Every node must have a Required Service'] : false;
          }
          for (var j in wizard.services) {
            var name = wizard.services[j].name;
            if (control[name] % 2 != 1 && hasControl[name])
              return output ? [false, "An Odd Number of " + wizard.services[j].description + " Control Services is Required"] : false;
          }

          return output ? [true, ''] : true;
        }
      }, {
        name: "Overview",
        path: "views/wizard/overview.html",
        icon: "airplanemode_active",
        complete: function () {
          return true;
        },
        onStep: function () {
          $scope.submitStatus = 0;
          api("/api/v2/deployments" + (workloads.createDeployment ? "" : "/" + workloads.deployment_id + "/batch"), {
            method: workloads.createDeployment ? "POST" : "PUT",
            data: $scope.generateBlob()
          }).then(function () {
            $scope.submitStatus = 1;
          }, function (err) {
            api.toast("Error Running Wizard", "deployments", err.data)
            $scope.submitStatus = -1;
          })
        },
      }, {
        path: "views/wizard/done.html",
        complete: function () {
          return false; },
        finalStep: true,
      }];

      $scope.editInHelper = function () {
        localStorageService.add('api_helper_payload', JSON.stringify($scope.generateBlob(), null, "  "));
        localStorageService.add('api_helper_method', workloads.createDeployment ? 'post' : 'put');
        localStorageService.add('api_helper_route', workloads.createDeployment ? '/api/v2/deployments' : '/api/v2/deployments/' + workloads.deployment_id + '/batch');
        $location.path("/api_helper");
      };

      $scope.setProgress = function (status) {
        if (status <= $scope.status)
          $scope.done = status;
      };

      $scope.canNext = false;
      $scope.setCanNext = function () {
        $scope.canNext = true;
      }

      $scope.nextStep = function () {
        if ($scope.status > $scope.done) {
          $scope.done++;
          $scope.canNext = false;
        } else if ($scope.status == $scope.done) {
          if ($scope.steps[$scope.done].complete()) {

            if ($scope.steps[$scope.done].onStep)
              $scope.steps[$scope.done].onStep();

            $scope.done++;
            $scope.status++;
            $scope.canNext = false;
          }
        }
      }

      $scope.prevStep = function () {
        if ($scope.done > 0)
          $scope.done--;
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

      $scope.providerMap = {};
      for (var i in $scope._providers) {
        var provider = $scope._providers[i];
        $scope.providerMap[provider.name] = provider;
        if (provider.type === 'MetalProvider' || provider.type == '') {
          continue;
        }
        this.provider = provider.name;
      }

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
      var serviceMap = $scope.serviceMap = {};

      $scope.$emit('title', wizard.name + ' Wizard');

      this.name = barclamp.cfg_data.barclamp.name;

      $scope.osList = [];

      if (wizard.system_nodes)
        api('/api/v2/nodes/system-phantom.internal.local/attribs/provisioner-available-oses').
      then(function (resp) {
        var data = resp.data;
        if (data.value) {
          $scope.osList = Object.keys(data.value);
          // remove available OSes that are not in the barclamp supported OS list (skip if there are no supported in the list)
          for (var i in $scope.osList) {
            if (barclamp.cfg_data.barclamp.os_support && barclamp.cfg_data.barclamp.os_support.length && barclamp.cfg_data.barclamp.os_support.indexOf($scope.osList[i]) == -1)
              $scope.osList.splice(i, 1);
          }
          if ($scope.osList.length) {
            workloads.attribs["provisioner-target_os"] = $scope.osList[0];
          }
        }
      });

      $scope.attribMap = {};
      api('/api/v2/attribs').
      then(function (resp) {
        var data = resp.data;
        for (var i in data) {
          var attrib = data[i];
          $scope.attribMap[attrib.name] = attrib;
        }

        for (var i in wizard.base_attribs) {
          var attrib = wizard.base_attribs[i]
          if (typeof workloads.attribs[attrib] === 'undefined') {
            workloads.attribs[attrib] = $scope.attribMap[attrib].default.value;
          }
        }

        for (var i in wizard.advanced_attribs) {
          var attrib = wizard.advanced_attribs[i]
          if (typeof workloads.attribs[attrib] === 'undefined') {
            workloads.attribs[attrib] = $scope.attribMap[attrib].default.value;
          }
        }
      }, function (err) {
        api.toast('Error fetching Attribs', 'attribs', err.data);
      });

      $scope.roles = [];
      $scope.roleMap = {};
      for (var id in $scope._roles) {
        var role = $scope._roles[id];
        $scope.roleMap[role.name] = role;
        /*if (serviceList.includes(role.name)) {
          $scope.roles.push(role);
        }*/
      }

      // find the first required service, if any
      for (var i = 0; i < wizard.services.length; i++) {
        var type = wizard.services[i].type;
        if (type === "required") {
          workloads.required_service = wizard.services[i].name;
          break;
        }
      }

      // in this model, we pre-collect BOTH the system and created nodes up front

      // build list of created nodes
      $scope.newId = -1;
      $scope.createdNodes = [];
      $scope.systemNodes = [];

      $scope.createNodes = function() {
        $scope.createdNodes = [];
        if (wizard.create_nodes){
          // create nodes from service list
          for (var i = 0; i < wizard.services.length; i++) {
            var name = wizard.services[i].name;
            var type = wizard.services[i].type;
            var count = wizard.services[i].count;
            if (count > 0 && (type === "control" || type === "worker")) {
              for (var j = 0; j < count; j++) {
                // negative ids so we know to create a new node
                var nid = $scope.newId--;
                var node = {
                  id: nid,
                  name: -nid + "-create-" + name + "-" + (j+1),
                  order: nid
                };
                // service map nodes
                serviceMap[nid] = {};
                serviceMap[nid][type] = true;
                if (workloads.required_service != '')
                  serviceMap[nid][workloads.required_service] = true
                // collect nodes
                $scope.createdNodes.push(node);
                workloads.selected.push(node);
              }
            }
          }
        }
      };
      $scope.createNodes();

      $scope.addNodes = function() {
        // negative ids so we know to create a new node
        var nid = $scope.newId--;
        var node = {
          id: nid,
          name: -nid + "-added-node",
          order: nid
        };
        // service map nodes
        serviceMap[nid] = {};
        if (workloads.required_service != '');
          serviceMap[nid][workloads.required_service] = true;
        serviceMap[nid]['worker'] = true;
        // add nodes
        $scope.createdNodes.push(node);
        workloads.selected.push(node);
      }


      $scope.collectNodes = function() {

        $scope.systemNodes = [];

        if (wizard.system_nodes && workloads.use_system) {
          // retrieve nodes from system deployment
          var system_id = 0;
          for (var i in $scope._deployments) {
            var deployment = $scope._deployments[i];
            if (deployment.system) {
              system_id = i;
              break;
            }
          }
          // collect system nodes
          Object.keys($scope._nodes).forEach(function (id) {
            var node = $scope._nodes[id];
            var source_id = system_id;
            for (var i in $scope._deployments) {
              if ($scope._deployments[i].name == workloads.source) {
                source_id = $scope._deployments[i].id
                break;
              }
            }
            // add node if isn't in source deployment or a system node
            if (!node.system && node.deployment_id == source_id) {
              // service map nodes
              serviceMap[id] = {};
              for (var i = 0; i < wizard.services.length; i++) {
                var type = wizard.services[i].type;
                var count = wizard.services[i].count;
                if (count > 0 && (type === "control" || type === "worker")) {
                  serviceMap[id][type] = true;
                  wizard.services[i].count--;
                  break;
                }
              }
              if (workloads.required_service != '')
                serviceMap[id][workloads.required_service] = true
              // collect nodes
              console.log("adding node " + node.name + " from deployment id " + source_id);
              $scope.systemNodes.push(node);
              workloads.selected.push(node);
            }
          });
        }
      };

      $scope.select = function (node, service) {
        var state = serviceMap[node.id][service.name];
        switch (service.type) {
        case 'required': // functions as a radio: only one at a time
          if (state)
            return;
          for (var i in serviceMap[node.id]) {
            var s;
            for (var j in wizard.services) {
              if (wizard.services[j].name === i) {
                s = wizard.services[j];
                break;
              }
            }
            if (s && s.type == 'required')
              serviceMap[node.id][i] = false;
          }
          serviceMap[node.id][service.name] = true;
          break;

        case 'control': // functions like optional, but disables worker
          if (!state) {
            for (var i in serviceMap[node.id]) {
              var s;
              for (var j in wizard.services) {
                if (wizard.services[j].name === i) {
                  s = wizard.services[j];
                  break;
                }
              }
              if (s && s.type == 'worker')
                serviceMap[node.id][i] = false;
            }
            serviceMap[node.id][service.name] = true;
          } else {
            serviceMap[node.id][service.name] = false;
          }
          break;

        case 'worker': // functions like optional
          if (!state) {
            for (var i in serviceMap[node.id]) {
              var s;
              for (var j in wizard.services) {
                if (wizard.services[j].name === i) {
                  s = wizard.services[j];
                  break;
                }
              }
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
        if (workloads.use_system) {
          return $scope.systemNodes;
        } else {
          return $scope.createdNodes;
        }
      };

      $scope.generateBlob = function () {
        console.log("JSON generate starting");
        var data = {
          commit: workloads.commit,
          attribs: workloads.attribs
        };
        if (workloads.createDeployment)
          data.name = workloads.name;

        if (!workloads.use_system) {
          var hints = $scope.providerMap[workloads.provider].auth_details["provider-create-hint"];
          if (!hints) {
            var ptype = $scope.providerMap[workloads.provider]["type"];
            hints = $scope.providerTemplates[ptype]["provider-create-hint"].default;
          }
          data.provider = {
            name: workloads.provider,
            hints: hints,
          };
        }
        console.log("JSON generating nodes in " + data);

        var virtualNodes = 0;
        var gcount = 0;
        data.nodes = [];

        for (var i in workloads.selected) {
          var node = workloads.selected[i];
          var id = node.id;
          var roles = [];

          console.log("JSON generate adding roles to node " + node);
          for (var j in wizard.services) {
            var service = wizard.services[j];
            var hasService = serviceMap[node.id][service.name];
            if (hasService) {
              for (var k in service.roles) {
                var serviceRoles = service.roles[k];
                for (var l in serviceRoles) {
                  var reqs = serviceRoles[l];
                  if (serviceMap[node.id][k] && roles.indexOf(reqs) < 0) {
                    roles.push(reqs);
                  }
                }
              }
            }
          }

          roles = roles.sort();

          if (id > 0) {
            data.nodes.push({
              id: $scope._nodes[id].name,
              roles: roles
            });
          } else {
            var existing = false;
            // check to see if we already have a cloud node with the same roles
            for (var j in data.nodes) {
              var n = data.nodes[j];
              if (typeof n.id == "string" || n.id > 0)
                continue;
              // unfortunately the only way to compare arrays
              if (JSON.stringify(n.roles) == JSON.stringify(roles)) {
                n.count++;
                existing = true;
                break;
              }
            }

            if (!existing) {
              gcount += 1;
              data.nodes.push({
                id: -(++virtualNodes),
                prefix: workloads.name + "-group-" + gcount,
                roles: roles,
                count: 1,
              });
            }
          }
        }

        // If we have keys, add them here
        console.log("JSON generate adding keys");
        for (var k in workloads.keys) {
          if (workloads.keys[k]) {
            var kvp = workloads.keys[k];
            if (kvp && kvp[1].length > 20) {
              if (!data.public_keys) {
                data.public_keys = {};
              }
              data.public_keys[kvp[0]] = kvp[1];
            }
          }
        }

        // If we have a role apply order, then pass it along
        console.log("JSON generate apply order");
        if (wizard.role_apply_order && wizard.role_apply_order.length > 1) {
          data.role_apply_order = wizard.role_apply_order;
        }

        return data;
      }

    });
})();
