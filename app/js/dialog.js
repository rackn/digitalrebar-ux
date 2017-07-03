/*
  Copyright 2017, RackN
  Dialog Controller
*/
(function () {
  angular.module('app').controller('DialogController', [
    '$scope', '$rootScope', '$mdDialog', 'locals', 'api', '$mdToast',
    'debounce', '$location', 'localStorageService',
    function ($scope, $rootScope, $mdDialog, locals, api, $mdToast, debounce,
      $location, localStorageService) {
      // keep locals from the config
      $scope.locals = locals;

      locals.api = api;

      // have icons persist
      $scope.icons = $rootScope.icons;

      $scope.fixCaps = function (tenant) {
        let caps = locals.user.caps[tenant.id].caps;
        for(let i in caps) {
          let cap = caps[i];
          if(typeof cap === 'object') {
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
        let providers = [];
        for (let id in locals._providers) {
          let provider = locals._providers[id];
          if (Object.keys(provider.auth_details).length)
            providers.push(provider);
        }
        return providers;
      })();

      // Used with ace text editor to convert objects to JSON automatically
      $scope.loadProvider = function(name) {
        return function(editor) {
          editor.setValue(
            JSON.stringify(locals.provider.auth_details[name], 0, '  '),
            -1
          );
          editor.getSession().on('change', function() {
            try {
              locals.provider.auth_details[name] = JSON.parse(
                editor.getValue()
              );
            } catch (e) { /* eslint no-empty: off*/ }
          });
        };
      };

      // Used with ace text editor to convert objects to JSON automatically
      $scope.loadBarclamp = function(editor) {
        editor.setValue(
          JSON.stringify(locals.barclamp.cfg_data, 0, '  '),
          -1
        );
        editor.getSession().on('change', function() {
          try {
            locals.barclamp.cfg_data = JSON.parse(
              editor.getValue()
            );
          } catch (e) { /* eslint no-empty: off*/ }
        });
      };

      // Used with ace text editor to convert objects to JSON automatically
      $scope.loadProfile = name => function(editor) {
        editor.setValue(locals.profile.values[name].value,
          -1
        );
        editor.getSession().on('change', function() {
          try {
            locals.profile.values[name].value = editor.getValue();
          } catch (e) { /* eslint no-empty: off*/ }
        });
      };

      $scope.providerMap = (function () {
        let pm = {};
        for (let i in locals._providers) {
          let provider = locals._providers[i];
          pm[provider.name] = provider;
          if (provider.type === 'MetalProvider' || provider.type === '') {
            continue;
          }
        }
        return pm;
      })();

      $scope.hide = function () {
        $mdDialog.hide();
      };

      $scope.cancel = function () {
        $mdDialog.cancel();
      };

      $scope.parse = function (data, bool) {
        try {
          let a = JSON.parse(data);
          // sometimes data can be "false"
          return (bool ? typeof a !== 'undefined' : a);
        } catch (e) {
          return false;
        }
      };

      this.updateBarclamp = function () {
        let config = $scope.locals.barclamp.cfg_data;
        if (!config) {
          api.toast('Bad JSON', 'barclamp', {
            message: 'dialog.js updateBarclamp'
          });
          return;
        }
        if (!config.barclamp.name) {
          api.toast('Name is required', 'barclamp', {
            message: 'dialog.js updateBarclamp'
          });
          return;
        }
        api.saveBarclamp(config);
        $mdDialog.hide();
      };

      this.updateNode= function() {
        let payload = {
          'name': locals.name1,
          'description': locals.description1,
          'profiles': locals.profiles1
        };
        api('/api/v2/nodes/' + locals.id, {
          method: 'PUT',
          data: payload
        }).then(function (resp) {
          api.toast('Updated Node ' + locals.node.name);
          api.addNode(resp.data);
          $mdDialog.hide();
        }, function (err) {
          api.toast('Error Updating Node', 'node', err.data);
        });
      };

      this.editNodesInHelper = function () {
        let provider = locals.providers[locals.provider].name;

        let hints = $scope.providerMap[provider]
          .auth_details['provider-create-hint'];
        if (hints === null) {
          let ptype = $scope.providerMap[provider]['type'];
          hints = $rootScope
            .providerTemplates[ptype]['provider-create-hint'].default;
        }

        let payload = {
          'name': locals.base_name + '.' + provider + '.neode.org',
          'description': 'created by rebar',
          'provider': provider,
          'profiles': locals.profiles,
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


        localStorageService.add('api_helper_payload',
          JSON.stringify(payload, null, '  '));
        localStorageService.add('api_helper_method', 'post');
        localStorageService.add('api_helper_route', '/api/v2/nodes/');
        $mdDialog.hide();
        $location.path('/api_helper');
      };

      this.addNodes = function () {
        // create a list of `locals.number` numbers
        let times = Array.apply(null, {
          length: locals.number
        }).map(Number.call, Number);

        let provider;
        locals.provider = parseInt(locals.provider);
        locals._providers.forEach(obj => {
          if(obj.id === locals.provider) {
            provider = obj.name;
          }
        });
        let hints = $scope
          .providerMap[provider].auth_details['provider-create-hint'];
        if (hints === null) {
          let ptype = $scope.providerMap[provider]['type'];
          hints = $rootScope
          .providerTemplates[ptype]['provider-create-hint'].default;
        }

        times.forEach(function (i) {
          let payload = {
            'name': locals.base_name + '-' + i + '.' + provider + '.neode.org',
            'description': 'created by rebar',
            'provider': provider,
            'profiles': locals.profiles,
            'deployment_id': locals.deployment_id,
            'hints': {
              'use-proxy': false,
              'use-ntp': false,
              'use-dns': false,
              'use-logging': false,
              'provider-create-hint': hints
            }
          };

          payload.hints['provider-create-hint'].hostname =
            locals.base_name + '-' + i;

          api('/api/v2/nodes', {
            method: 'POST',
            data: payload,
          }).then(function(resp){api.addNode(resp.data);}, function (err) {
            api.toast('Error updating node', 'node', err.data);
          });
        });

        api.toast('Adding ' + locals.number +
          ' node' + (locals.number !== 1 ? 's' : ''));

        $mdDialog.hide();
      };

      this.addProvider = function () {
        api('/api/v2/providers', {
          method: 'POST',
          data: locals.provider
        }).then(function(resp){api.addProvider(resp.data);}, function (err) {
          api.toast('Error Adding Provider', 'provider', err.data);
        });
        $mdDialog.hide();
      };

      this.addNetwork = function () {
        locals.network.name = locals.network.category +
          '-' + locals.network.group;
        //locals.network.allow_anon_leases
        api('/api/v2/networks', {
          method: 'POST',
          data: locals.network
        }).then(function(resp){api.addNetwork(resp.data);}, function (err) {
          api.toast('Error Adding Network', 'network', err.data);
        });
        $mdDialog.hide();
      };

      this.addDNSRecord = function () {
        let zone = locals.zone;
        api('/dns/zones/' + zone.name, {
          method: 'PATCH',
          data: locals.record
        }).then(api.getHealth, api.getHealth);
        $mdDialog.hide();
      };

      this.createTemplate = function () {
        let template = $scope.locals.template;
        let path, method, data;

        if (locals.editing) {
          path = '/provisioner/templates/' + template.UUID;
          method = 'PATCH';
          data = [{op: 'replace', path: '/Contents', value: template.Contents}];
        } else {
          path = '/provisioner/templates';
          method = 'POST';
          data = template;
        }

        api(path, {
          method: method,
          data: data
        }).then(api.getHealth, api.getHealth);

        $mdDialog.hide();
      };

      $scope.selectedFile = '';
      $scope.selectFile = function() {
        document.getElementById('file').click();
      };

      $scope.updateTemplateContents = function(){
        let fileElem = document.getElementById('file');
        $scope.selectedFile = '';
        let f = fileElem.files[0],
          r = new FileReader();
        r.onloadend = function(e){
          let data = e.target.result;
          locals.template.Contents = data;
        };
        r.readAsBinaryString(f);
        fileElem.value = '';
      };


      this.createTenant = function () {
        let tenant = $scope.locals.tenant;
        let path, method, data;

        if (locals.editing) {
          path = '/api/v2/tenants/' + tenant.uuid;
          method = 'PATCH';
          data = [{
            op: 'replace',
            path: '/name',
            value: tenant.name
          }, {
            op: 'replace',
            path: '/description',
            value: tenant.description
          }, {
            op: 'replace',
            path: '/parent_id',
            value: tenant.parent_id
          }];
        } else {
          path = '/tenants';
          method = 'POST';
          data = angular.copy(tenant);
        }

        api(path, {
          method: method,
          data: data
        }).then(function () {
        }, function (err) {
          api.toast('Error creating tenant', 'tenants', err.data);
        });


        $mdDialog.hide();
      };

      this.createCapability = function () {
        let capability = $scope.locals.capability;
        let path, method, data;

        if (locals.editing) {
          path = '/api/v2/capabilities/' + capability.id;
          method = 'PATCH';
          data = [{
            op: 'replace',
            path: '/description',
            value: capability.description
          }];
        } else {
          capability.includes = ['USER_LOGIN'];
          capability.source = 'user-defined';
          path = '/api/v2/capabilities';
          method = 'POST';
          data = angular.copy(capability);
        }

        api(path, {
          method: method,
          data: data
        }).then(function () {
          if (!locals.editing) {
            api.toast('Added capability ' + capability.name);
            api.getHealth();
          }
        }, function (err) {
          api.toast('Error creating capability', 'capabilities', err.data);
        });

        $mdDialog.hide();
      };

      this.createUser = function () {
        let user = $scope.locals.user;
        let path, method, data;

        if (user.password1.length < 6) {
          api.toast('Password must be at least 6 characters', 'user');
          return;
        }

        if (user.password1 !== user.password2) {
          api.toast('Passwords must match', 'user');
          return;
        }

        // if we don't have a current tenant then assume it
        if (!user.current_tenant_id) {
          user.current_tenant_id = user.tenant_id;
        }

        data = user;
        if (locals.editing) {
          path = '/api/v2/users/' + user.id;
          method = 'PUT';
          if (user.password1 !== '') {
            data['digest'] = true;
            data['password'] = user.password1;
          }
        } else {
          path = '/api/v2/users';
          method = 'POST';
          if (user.password1 !== '') {
            data['digest'] = true;
            data['password'] = user.password1;
          }
          data = user;
        }

        api(path, {
          method: method,
          data: data
        }).then(api.getUsers, api.getUsers);

        $mdDialog.hide();
      };

      this.createBootEnv = function () {
        let env = $scope.locals.env;
        let path, method, data;

        if (locals.editing) {
          path = '/provisioner/bootenvs/' + env.Name;
          method = 'PATCH';
          data = [];
          let original = locals.original;
          for (let key in env) {
            if (JSON.stringify(env[key]) !== JSON.stringify(original[key]))
              data.push({
                op: 'replace',
                path: '/' + key,
                value: env[key]
              });
          }
        } else {
          path = '/provisioner/bootenvs';
          method = 'POST';
          data = env;
        }

        api(path, {
          method: method,
          data: data
        }).then(api.getHealth, api.getHealth);

        $mdDialog.hide();
      };


      this.profileSelectChanged = function (values, old_key, new_key) {
        let d = values[old_key];
        values[new_key] = d;
        if (typeof locals.attribs[new_key]['default'] !== undefined) {
          values[new_key].value = JSON.stringify(
            locals.attribs[new_key]['default'].value);
        }
        if (old_key !== new_key) {
          delete values[old_key];
        }
      };

      this.profileClearData = function (values, key) {
        delete values[key];
        return true;
      };

      this.profileNewValue = function (values) {
        values['new'] = { 'name': 'new', 'value': '' };
        return true;
      };

      this.createProfile = function () {
        let profile = $scope.locals.profile;
        let path, method, data;

        let newprofile = {};
        newprofile.name = profile.name;
        newprofile.values = {};
        for(let key in profile.values) {
          newprofile.values[key] = JSON.parse(profile.values[key].value);
        }

        if (locals.editing) {
          path = '/api/v2/profiles/' + newprofile.name;
          method = 'PATCH';
          data = [];
          let original = locals.original;
          for (let key in newprofile) {
            if (JSON.stringify(newprofile[key]) !==
                JSON.stringify(original[key]))
              data.push({
                op: 'replace',
                path: '/' + key,
                value: newprofile[key]
              });
          }
        } else {
          path = '/api/v2/profiles';
          method = 'POST';
          data = newprofile;
        }

        api(path, {
          method: method,
          data: data
        }).then(function (resp) {
          api.addProfile(resp.data);
          api.getHealth();
        }, api.getHealth);

        $mdDialog.hide();
      };

      this.updateUserCaps = function () {
        let user = locals.user;
        let user_id = user.id;
        let original = locals.original;
        let diff = [];
        for(let tenant_id in user.caps) {
          let tenant = user.caps[tenant_id].caps;
          let origTenant = original.caps[tenant_id].caps;
          let added = tenant.filter(function(i) {
            return origTenant.indexOf(i) < 0;
          });
          let removed = origTenant.filter(function(i) {
            return tenant.indexOf(i) < 0;
          });
          for(let i in added) {
            diff.push({
              method: 'POST',
              data: {
                tenant_id: tenant_id,
                user_id: user_id,
                capability_id: added[i]
              }
            });
          }
          for(let i in removed) {
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
        for(let i in diff) {
          let config = diff[i];
          api('/api/v2/user_tenant_capabilities', config)
          .then(debounce(locals.update, 500, true));
        }

        $mdDialog.hide();

      };

      this.editAttrib = function (target) {
        let id = locals.id;
        let value;
        try {
          value = JSON.parse(locals.value);
        } catch (e){
          return;
        }
        let obj = { value: value };
        obj[target['obj']] = target['id'];
        // figure out right method to propose
        let propose_url = '';
        switch (target['obj']) {
        case 'node_role_id':
          propose_url = '/api/v2/node_roles/' + target['id'] + '/propose';
          break;
        case 'deployment_role_id':
          propose_url = '/api/v2/deployment_roles/' + target['id'] + '/propose';
          break;
        }
        // put attrib in proposed mode
        api(propose_url, { method: 'PUT'
        }).then(function () {
          api('/api/v2/attribs/' + id, {
            method: 'PUT',
            data: obj
          }).then(function (resp) {
            let data = resp.data;
            api.toast('Updated Attrib!');
            // update the on screen value (no auto refresh on attribs)
            locals.attrib.value = data.value;
            // track local DR proposed
            if (target['obj'] === 'deployment_role_id') {
              $rootScope._deployment_roles[target['id']].proposed = true;
            }
          }, function (err) {
            api.toast('Error updating attrib', 'attrib', err.data);
          });
        }, function (err) {
          api.toast('Error proposing target object', target['obj'], err.data);
        });
        $mdDialog.hide();
      };

    }
  ]);
})();
