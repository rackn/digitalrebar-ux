/*
dialog controller
*/
(function () {
  angular.module('app').controller('DialogController', function ($scope, $rootScope, $mdDialog, locals, api, $mdToast, debounce, $location, localStorageService) {
    // keep locals from the config
    $scope.locals = locals;

    // have icons persist
    $scope.icons = $rootScope.icons;
    
    $scope.fixCaps = function (tenant) {
      var caps = locals.user.caps[tenant.id].caps;
      for(var i in caps) {
        var cap = caps[i];
        if(typeof cap === "object") {
          caps[i] = cap.id;
        }
      }

      locals.user.caps[tenant.id].caps = caps.reduce(function(arr, id) {
        if(!arr.includes(id))
          arr.push(id);
        
        return arr;
      }, []);
    };

    $scope.providers = (function () {
      var providers = [];
      for (var id in locals.providers) {
        var provider = locals.providers[id];
        if (Object.keys(provider.auth_details).length)
          providers.push(provider);
      }
      return providers;
    })();

    $scope.providerMap = (function () {
      var pm = {};
      for (var i in locals.providers) {
        var provider = locals.providers[i];
          pm[provider.name] = provider;
          if (provider.type === 'MetalProvider' || provider.type == '') {
            continue;
          }
      }
      return pm;
    })()

    $scope.hide = function () {
      $mdDialog.hide();
    };

    $scope.cancel = function () {
      $mdDialog.cancel();
    };

    $scope.parse = function (data, bool) {
      try {
        var a = JSON.parse(data);
        // sometimes data can be "false"
        return (bool ? typeof a !== 'undefined' : a);
      } catch (e) {
        return false;
      }
    };

    this.updateBarclamp = function () {
      var config = $scope.locals.barclamp.cfg_data;
      if (!config) {
        api.toast('Bad JSON', 'barclamp', {message: "dialog.js updateBarclamp"});
        return;
      }
      if (!config.barclamp.name) {
        api.toast('Name is required', 'barclamp', {message: "dialog.js updateBarclamp"});
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
        api.toast('Error Updating barclamp', 'barclamp', err);
      })

      $mdDialog.hide();
    };

    this.editNodesInHelper = function () {
      var provider = locals.providers[locals.provider].name;

      var hints = $scope.providerMap[provider].auth_details["provider-create-hint"];
      if (hints == null) {
        var ptype = $scope.providerMap[provider]["type"];
        hints = $rootScope.providerTemplates[ptype]["provider-create-hint"].default;
      }

      var payload = {
        'name': locals.base_name + "." + provider + ".neode.org",
        'description': "created by rebar",
        'provider': provider,
        'deployment_id': locals.deployment_id,
        'hints': {
          'use-proxy': false,
          'use-ntp': false,
          'use-dns': false,
          'use-logging': false,
          'provider-create-hint': hints
        }
      };

      payload.hints['provider-create-hint']['hostname'] = locals.base_name;


      localStorageService.add('api_helper_payload', JSON.stringify(payload, null, "  "));
      localStorageService.add('api_helper_method', 'post');
      localStorageService.add('api_helper_route', '/api/v2/nodes/');
      $mdDialog.hide();
      $location.path("/api_helper");
    }

    this.addNodes = function () {
      // create a list of `locals.number` numbers 
      var times = Array.apply(null, { length: locals.number }).map(Number.call, Number);
      var provider = locals.providers[locals.provider].name;

      times.forEach(function (i) {
        var hints = $scope.providerMap[provider].auth_details["provider-create-hint"];
        if (hints == null) {
          var ptype = $scope.providerMap[provider]["type"];
          hints = $rootScope.providerTemplates[ptype]["provider-create-hint"].default;
        }

        var payload = {
          'name': locals.base_name + "-" + i + "." + provider + ".neode.org",
          'description': "created by rebar",
          'provider': provider,
          'deployment_id': locals.deployment_id,
          'hints': {
            'use-proxy': false,
            'use-ntp': false,
            'use-dns': false,
            'use-logging': false,
            'provider-create-hint': hints
          }
        };

        payload.hints['provider-create-hint']['hostname'] = locals.base_name + '-' + i;

        api('/api/v2/nodes', {
          method: "POST",
          data: payload,
        }).success(api.addNode).
        error(function (err) {
          api.toast('Error updating node', 'node', err);
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
        api.toast("Error Adding Provider", 'provider', err);
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
        api.toast("Error Adding Network", 'network', err);
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
        api.toast("Error creating tenant", "tenants", err)
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

    this.updateUserCaps = function () {
      var user = locals.user;
      var user_id = user.id;
      var original = locals.original;
      var diff = [];
      for(var tenant_id in user.caps) {
        var tenant = user.caps[tenant_id].caps;
        var origTenant = original.caps[tenant_id].caps;
        var added = tenant.filter(function(i) {return origTenant.indexOf(i) < 0;});
        var removed = origTenant.filter(function(i) {return tenant.indexOf(i) < 0;});
        for(var i in added) {
          diff.push({
            method: 'POST',
            data: {
              tenant_id: tenant_id,
              user_id: user_id, 
              capability_id: added[i]
            }
          });
        }
        for(var i in removed) {
          diff.push({
            method: 'DELETE',
            params: {
              tenant_id: tenant_id,
              user_id: user_id,
              capability_id: removed[i]
            }
          });
        }
      }
      for(var i in diff) {
        var config = diff[i];
        api("/api/v2/user_tenant_capabilities", config).success(function(data) {
          debounce(locals.update, 500, true)();
        });
      }

      $mdDialog.hide();

    };

    this.editAttrib = function (target) {
      var id = locals.id;
      var value;
      try {
        value = JSON.parse(locals.value);        
      } catch (e){
        return;
      }
      var obj = { value: value };
      obj[target["obj"]] = target["id"];
      api("/api/v2/attribs/" + id, {
        method: 'PUT',
        data: obj
      }).success(function (data) {
        api.toast('Updated Attrib!');
      }).
      error(function (err) {
        api.toast('Error updating attrib','attrib',err);
      });
      $mdDialog.hide();
    };

  });
})();
