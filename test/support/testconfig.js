QUnit.testStart(function(test) {
	var module = test.module ? test.module : '';
	console.log('#' + module + " " + test.name + ": starting setup.");

	// Display an error if asynchronous operations are queued outside of
	// Ember.run.  You need this if you want to stay sane.
	Ember.testing = true;

	// stub for unit tests
	Ember.ENV.BALANCED.WWW = 'http://example.org';

	Ember.$('<style>#ember-testing-container { position: absolute; background: white; bottom: 0; right: 0; width: 640px; height: 600px; overflow: auto; z-index: 9999; border: 1px solid #ccc; } #ember-testing { zoom: 50%; }</style>').appendTo('head');
	Ember.$('<div id="ember-testing-container"><div id="ember-testing"></div></div>').appendTo('body');

	Ember.run(function() {
		window.setupBalanced('#ember-testing');

		Balanced.TEST = {};
		Balanced.THROTTLE = 0;
		Balanced.setupForTesting();

	});

	Ember.run(function() {
		window.Balanced.advanceReadiness();
	});

	Balanced.injectTestHelpers();

	window.Balanced.onLoad();

	// turn off ajax async
	$.ajaxSetup({
		async: false
	});

	// use the fixture adapter
	Balanced.TEST.setupFixtures = function() {
		Balanced.Adapter = Balanced.FixtureAdapter.create();
		window.setupTestFixtures();
	};

	// build up test fixtures
	Balanced.TEST.setupMarketplace = function() {
		Ember.run(function() {
			Balanced.Auth.createNewGuestUser().then(function(apiKey) {
				var apiKeySecret = apiKey.get('secret');
				var settings = {
					headers: {
						Authorization: Balanced.Utils.encodeAuthorization(apiKeySecret)
					}
				};
				return Balanced.Marketplace.create().save(settings);
			}).then(function(marketplace) {
				Balanced.Auth.setupGuestUserMarketplace(marketplace);
				Balanced.TEST.marketplace = marketplace;
				Balanced.TEST.MARKETPLACE_ID = marketplace.get('id');

				balanced.init(marketplace.get('uri'));

				marketplace.get('owner_customer').then(function(customer) {
					Balanced.TEST.customer = customer;
					Balanced.TEST.CUSTOMER_ID = customer.get('id');
				});

				console.log('%@ %@: setup complete. Starting test'.fmt(module, test.name));
			});
		});
	};

	Balanced.TEST.bankAccountTokenizingStub = sinon.stub(balanced.bankAccount, "create");
	Balanced.TEST.cardTokenizingStub = sinon.stub(balanced.card, "create");
	Balanced.TEST.balancedInitStub = sinon.stub(balanced, "init");
});

QUnit.testDone(function(test) {
	var module = test.module ? test.module : '';
	console.log('#%@ %@: tearing down.'.fmt(module, test.name));

	Balanced.TEST.bankAccountTokenizingStub.restore();
	Balanced.TEST.cardTokenizingStub.restore();
	Balanced.TEST.balancedInitStub.restore();

	Balanced.removeTestHelpers();
	Ember.run(Balanced, Balanced.destroy);
	Balanced = null;
	Ember.$('#ember-testing-container, #ember-testing').remove();

	Ember.testing = false;

	console.log('#%@ %@: done.'.fmt(module, test.name));
});
