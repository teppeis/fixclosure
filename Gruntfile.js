module.exports = function(grunt) {
  grunt.initConfig({
    mochacov: {
      options: {
        files: ['test/*.coffee']
      },
      test: {
        options: {
          reporter: 'spec'
        }
      },
      coveralls: {
        options: {
          coveralls: {
            serviceName: 'travis-ci'
          }
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-mocha-cov');

  grunt.registerTask('coveralls', ['mochacov:coveralls']);
  grunt.registerTask('test', ['mochacov:test']);
  grunt.registerTask('default', ['test', 'coveralls']);
};
