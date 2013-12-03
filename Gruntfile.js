'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'index.js',
        'lib/*.js',
        'bin/*.js'
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },
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
    },
    watch: {
      test: {
        files: [
          '.jshintrc',
          'Gruntfile.js',
          'index.js',
          'bin/**/*',
          'lib/**/*',
          'test/**/*'
        ],
        tasks: ['test']
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-cov');

  grunt.registerTask('coveralls', ['mochacov:coveralls']);
  var testTasks = ['jshint', 'mochacov:test'];
  if (process.env.TRAVIS_JOB_ID) {
    testTasks.push('coveralls');
  }
  grunt.registerTask('test', testTasks);
  grunt.registerTask('default', ['test']);
};
