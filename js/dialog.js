/*
dialog controller
*/
(function () {
  angular.module('app').controller('DialogController', function ($scope, $rootScope, $mdDialog, locals, api, $mdToast) {
    // keep locals from the config
    var dialog = this;
    $scope.locals = locals;

    // have icons persist
    $scope.icons = $rootScope.icons;

    $scope.providers = (function () {
      var providers = [];
      for (var id in locals.providers) {
        var provider = locals.providers[id];
        if (Object.keys(provider.auth_details).length)
          providers.push(provider);
      }
      return providers;
    })();

    $scope.hide = function () {
      $mdDialog.hide();
    };

    $scope.cancel = function () {
      $mdDialog.cancel();
    };

    this.updateBarclamp = function () {
      var config = $scope.locals.barclamp.cfg_data;
      if (!config) {
        api.toast('Bad JSON', 'barclamp');
        return;
      }
      if (!config.barclamp.name) {
        api.toast('Name is required', 'barclamp');
        return;
      }
      var payload = { 'value': config };
      api('/api/v2/barclamps', {
        method: 'POST',
        data: payload
      }).success(function (update) {
        api('/api/v2/barclamps/' + $scope.locals.barclamp.id).
        success(api.addBarclamp);
        api.toast('Updated barclamp');
      }).error(function (err) {
        api.toast('Error: ' + err.message, 'barclamp');
      })

      $mdDialog.hide();
    };

    this.addNodes = function () {
      // create a list of `locals.number` numbers 
      var times = Array.apply(null, { length: locals.number }).map(Number.call, Number);

      times.forEach(function (i) {
        var payload = {
          'name': locals.base_name + "-" + i + "." + locals.provider + ".neode.org",
          'description': "created by rebar",
          'provider': locals.provider,
          'deployment_id': locals.deployment_id,
          'hints': {
            'use-proxy': false,
            'use-ntp': false,
            'use-dns': false,
            'use-logging': false,
            'provider-create-hint': {
              'hostname': locals.base_name + '-' + i
            }
          }
        };
        if (locals.add_os != "default_os") {
          // packet
          payload.hints['provider-create-hint'].os = locals.add_os;
          // aws
          payload.hints['provider-create-hint'].image_id = locals.add_os;
          // google
          payload.hints['provider-create-hint'].disks = [];
          payload.hints['provider-create-hint'].disks.push({
            'autoDelete': true,
            'boot': true,
            'type': 'PERSISTENT',
            'initializeParams': {
              'sourceImage': locals.add_os
            }
          });
        };


        api('/api/v2/nodes', {
          method: "POST",
          data: payload,
        }).success(api.addNode).
        error(function (err) {
          api.toast('Error: ' + err.message, 'node', 'node');
        });
      });

      api.toast('Adding ' + locals.number + ' node' + (locals.number != 1 ? 's' : ''));

      $mdDialog.hide();
    };

    this.addProvider = function () {
      api("/api/v2/providers", {
        method: "POST",
        data: locals.provider
      }).success(api.addProvider).
      error(function (err) {
        api.toast("Error Adding Provider - " + err.message, 'provider');
      });
      $mdDialog.hide();
    };

    this.addNetwork = function () {
      locals.network.name = locals.network.category + "-" + locals.network.group;
      api("/api/v2/networks", {
        method: "POST",
        data: locals.network
      }).success(api.addNetwork).
      error(function (err) {
        api.toast("Error Adding Network - " + err.message, 'network');
      });
      $mdDialog.hide();
    };

    this.addDNSRecord = function () {
      var zone = locals.zone;
      api("/dns/zones/" + zone.name, {
        method: 'PATCH',
        data: locals.record
      }).success(function (data) {
        api.getHealth();
      }).
      error(function (err) {
        api.getHealth();
      });
      $mdDialog.hide();
    };

    this.createTemplate = function () {
      var template = $scope.locals.template;
      var path, method, data;

      if (locals.editing) {
        path = '/provisioner/templates/' + template.UUID;
        method = 'PATCH';
        data = [{ "op": "replace", "path": "/Contents", "value": template.Contents }];
      } else {
        path = '/provisioner/templates';
        method = 'POST';
        data = template;
      }

      api(path, {
        method: method,
        data: data
      }).success(function (update) {
        api.getHealth();
      }).error(function (err) {
        api.getHealth();
      });

      $mdDialog.hide();
    };

    this.createTenant = function () {
      var tenant = $scope.locals.tenant;
      var path, method, data;

      if (locals.editing) {
        path = '/tenants/' + tenant.uuid;
        method = 'PATCH';
        data = [{ "op": "replace", "path": "/name", "value": tenant.name },
                { "op": "replace", "path": "/description", "value": tenant.description },
                { "op": "replace", "path": "/parent_id", "value": tenant.parent_id }];
      } else {
        path = '/tenants';
        method = 'POST';
        data = angular.copy(tenant);
      }

      api(path, {
        method: method,
        data: data
      }).success(function (update) {
      }).error(function (err) {
        api.toast("Error creating tenant - "+err.message, "tenants")
      });


      $mdDialog.hide();
    };

    this.createUser = function () {
      var user = $scope.locals.user;
      var path, method, data;

      if (user.password1 != user.password2) {
        api.toast('Passwords must match', 'user');
        return;
      }

      data = user;
      if (locals.editing) {
        path = '/users/' + user.id;
        method = 'PUT';
        if (user.password1 != "") {
          data["digest"] = true;
          data["password"] = user.password1;
        }
      } else {
        path = '/users';
        method = 'POST';
        if (user.password1 != "") {
          data["digest"] = true;
          data["password"] = user.password1;
        }
        data = user;
      }

      api(path, {
        method: method,
        data: data
      }).success(function (update) {
        api.getUsers();
      }).error(function (err) {
        api.getUsers();
      });

      $mdDialog.hide();
    };

    this.createBootEnv = function () {
      var env = $scope.locals.env;
      var path, method, data;

      if (locals.editing) {
        path = '/provisioner/bootenvs/' + env.Name;
        method = 'PATCH';
        data = [];
        var original = locals.original;
        for (var key in env) {
          if (JSON.stringify(env[key]) !== JSON.stringify(original[key]))
            data.push({
              op: "replace",
              path: "/" + key,
              value: env[key]
            })
        }
      } else {
        path = '/provisioner/bootenvs';
        method = 'POST';
        data = env;
      }

      api(path, {
        method: method,
        data: data
      }).success(function (update) {
        api.getHealth();
      }).error(function (err) {
        api.getHealth();
      });

      $mdDialog.hide();
    };

  });
})();
