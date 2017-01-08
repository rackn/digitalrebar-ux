/*
barclamps controller
*/
(function () {
  angular.module('app').controller('BarclampsCtrl', function ($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog, api) {

    $scope.$emit('title', 'Barclamps'); // shows up on the top toolbar

    $scope.myOrder = 'id'

    // converts the barclamps object that rootScope has into an array
    $scope.getBarclamps = function () {
      var barclamps = [];
      for (var id in $scope._barclamps) {
        barclamps.push($scope._barclamps[id]);
      }
      return barclamps;
    };

    // gets an array of roles from an array of role names 
    $scope.getRoles = function (roles) {
      if (!roles)
        return [];

      roles = roles.map(function (role) {
        return role.name
      });
      var out = [];
      for (var id in $scope._roles) {
        var role = $scope._roles[id];
        if (roles.includes(role.name))
          out.push(role);
      }
      return out;
    }

    $scope.selectedFile = '';
    $scope.selectFile = function() {
      document.getElementById('file').click();
    };

    $scope.upload = function(){
      var fileElem = document.getElementById('file');
      $scope.selectedFile = ''
      var f = fileElem.files[0],
          r = new FileReader();
      r.onloadend = function(e){
        var data = e.target.result;
        api.addBarclamp(data);
        //send your binary data via $http or $resource or do anything else with it
      }
      r.readAsBinaryString(f);
      fileElem.value = '';
    }

    this.showUpdateBarclampDialog = function (ev) {
      var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
      var bc = $scope.barclamp;
      if (!bc) {
        var date = new Date();
        var name = "id"+ Math.round((Math.random() * 10000));
        // create template barclamp based on script
        $scope.barclamp = {
          name: name,
          cfg_data: {
            barclamp: {
              name: "workload_" + name,
              description: "User Created Workload " + name,
              version: "0.0"
            }, roles: [
              {
                name: "user_role_" + name,
                description: "User Created Role " + name,
                jig: "script",
                metadata: {
                  scripts: [ '#!/bin/bash\necho "Show Available Attributes"\ncat $TMPDIR/attrs.json | jq .\nexit 0\n' ]
                }
              }
            ]
          }
        };
       };
      console.log($scope.barclamp);
      $mdDialog.show({
        controller: 'DialogController',
        controllerAs: 'dialog',
        templateUrl: 'views/dialogs/updatebarclampdialog.tmpl.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        locals: {
          barclamp: $scope.barclamp
        },
        clickOutsideToClose: true,
        fullscreen: useFullScreen
      });
    };

    $scope.id = $routeParams.id;
    $scope.barclamp = {};

    var hasCallback = false;

    var updateBarclamp = function () {
      $scope.barclamp = $scope._barclamps[$scope.id];
      if (!$scope.barclamp)
        $location.path('/barclamps');
      else if (!hasCallback) {
        hasCallback = true;
        $scope.$on('barclamp' + $scope.barclamp.id + "Done", updateBarclamp);
      }
    }

    if (Object.keys($scope._barclamps).length) {
      updateBarclamp();
    } else {
      $scope.$on('barclampsDone', updateBarclamp);
    }

  });

})();
