REPORTER = spec

test:
	$(MAKE) test-reporter
ifdef TRAVIS_JOB_ID
	$(MAKE) test-coveralls
else
	$(MAKE) test-cov-html
endif

test-reporter:
	./node_modules/.bin/mocha --reporter $(REPORTER)

lib-cov:
	rm -rf lib-cov
	./node_modules/jscoverage/bin/jscoverage lib lib-cov

test-cov-html:	lib-cov
	@COVERAGE=1 $(MAKE) test-reporter REPORTER=html-cov 1> coverage.html
	rm -rf lib-cov

test-coveralls:	lib-cov
	@COVERAGE=1 $(MAKE) test-reporter REPORTER=mocha-lcov-reporter | ./node_modules/.bin/coveralls
	rm -rf lib-cov

.PHONY: test
