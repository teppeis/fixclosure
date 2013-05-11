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
  var testTasks = ['mochacov:test'];
  if (process.env.TRAVIS_JOB_ID) {
    testTasks.push('coveralls');
  }
  grunt.registerTask('test', testTasks);
  grunt.registerTask('default', ['test']);
};
