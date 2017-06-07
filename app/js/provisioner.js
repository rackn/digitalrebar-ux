/*
  Copyright 2017, RackN
  Provisioner Controller
*/
(function () {
  angular.module('app')
  .controller('ProvisionerCtrl', [
    '$scope', 'api', '$location', '$mdDialog', '$mdMedia', '$routeParams',
    function ($scope, api, $location, $mdDialog, $mdMedia, $routeParams) {
      // use the same controller for 3 pages, so handle the title for each location
      var route = $location.path().split('/')[2];
      var title = 'Provisioner ';
      switch (route) {
      case 'bootenvs':
        title += 'Boot Environments';
        api('/api/v2/attribs').then(function (resp) {
          $scope.attribs = resp.data.map(function (a) {
            return a.name;
          })
        });
        break;
      case 'templates':
        title += 'Templates';
        break;
      case 'machines':
        title += 'Machines';
        break;
      }
      $scope.$emit('title', title);

      $scope.expand = {};
      $scope.attribs = [];

      var mapNodes = function () {
        $scope.nodeMap = {};

        for (var id in $scope._nodes) {
          var node = $scope._nodes[id];
          $scope.nodeMap[node.uuid] = node;
        }

      };
      mapNodes();

      $scope.$on('nodesDone', mapNodes);

      if ($routeParams.id)
        $scope.expand[$routeParams.id] = true;

      $scope.deleteTemplate = function (uuid) {
        $scope.confirm(event, {
          title: 'Remove Template',
          message: 'Are you sure you want to remove this template?',
          yesCallback: function () {
            api('/provisioner/templates/' + uuid, {
              method: 'DELETE'
            }).then(api.getHealth, api.getHealth);
          }
        });
      };

      $scope.createTemplatePrompt = function (ev, temp) {
        var template = angular.copy(temp);
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/addtemplatedialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            editing: (typeof template !== 'undefined'),
            template: template || {UUID: '', Content: ''}
          },
          clickOutsideToClose: true,
          fullscreen: useFullScreen
        })
      }

      $scope.deleteBootEnv = function (name) {
        $scope.confirm(event, {
          title: 'Remove Boot Environment',
          message: 'Are you sure you want to remove this boot environment?',
          yesCallback: function () {
            api('/provisioner/bootenvs/' + name, {
              method: 'DELETE'
            }).then(api.getHealth, api.getHealth);
          }
        });
      };

      $scope.selectedFile = '';
      $scope.selectFile = function() {
        document.getElementById('file').click();
      };

      // this is only used for updating templates
      // look at Dialog.js:228 for creating new templates
      $scope.upload = function(uuid){
        var fileElem = document.getElementById('file');
        $scope.selectedFile = ''
        var f = fileElem.files[0],
            r = new FileReader();
        r.onloadend = function(e){
          var data = e.target.result;
          api('/provisioner/templates/' + uuid, {
            method: 'PATCH',
            data: [{op: 'replace', path: '/Contents', value: data}]
          }).then(function () {
            api.getHealth();
            api.toast('Updated template');
          }, function (err) {
            api.getHealth();
            api.toast('Error Updating template', 'template', err.data);
          })
          //send your binary data via $http or $resource or do anything else with it
        }
        r.readAsBinaryString(f);
        fileElem.value = '';
      }


      $scope.createBootEnvPrompt = function (ev, env) {
        var bootenv = angular.copy(env);
        $mdDialog.show({
          controller: 'DialogController',
          controllerAs: 'dialog',
          templateUrl: 'views/dialogs/addbootenvdialog.tmpl.html',
          parent: angular.element(document.body),
          targetEvent: ev,
          locals: {
            editing: (typeof bootenv !== 'undefined'),
            attribs: $scope.attribs,
            _provisioner: $scope._provisioner,
            env: bootenv || {
              Name: '',
              OS: {
                Name: '',
                Family: '',
                Codename: '',
                Version: '',
                IsoFile: '',
                IsoSha256: '',
                IsoUrl: ''
              },
              Kernel: '',
              Initrds: [],
              BootParams: '',
              RequiredParams: [],
              Templates: []
            },
            original: angular.copy(bootenv)
          },
          clickOutsideToClose: true,
          fullscreen: true
        });
      };

    }
  ]);
})();
