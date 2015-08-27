if (Meteor.isClient) {
    
    Tracker.autorun(function() {
	if (TurkServer.inExperiment()) {
	    Router.go('/experiment');
	} else if (TurkServer.inExitSurvey()) {
	    Router.go('/survey');
	}
    });

    Tracker.autorun(function() {
	var group = TurkServer.group();
	if (group == null) return;	
	Meteor.subscribe('clicks', group);
    });

    Template.hello.helpers({
	counter: function () {
	    var clickObj = Clicks.findOne();
	    return clickObj && clickObj.count;
	}
    });

    Template.hello.events({
	'click button#clickMe': function () {
	    Meteor.call('incClicks')
	}
    });

    Template.hello.events({
	'click button#exitSurvey': function () {
	    Meteor.call('goToExitSurvey');
	}
    });

    Template.survey.events({
	'submit .survey': function (e) {
	    var results = {confusing: e.target.confusing.value,
			   feedback: e.target.feedback.value}
	    TurkServer.submitExitSurvey(results);
	}
    });

}

if (Meteor.isServer) {

    Meteor.startup(function () {
	Batches.upsert({name: "main"}, {name: "main", active: true});
	var batch = TurkServer.Batch.getBatchByName("main");
	batch.setAssigner(new TurkServer.Assigners.SimpleAssigner);
    });

    TurkServer.initialize(function() {
	Clicks.insert({count: 0});
    });

    Meteor.publish('clicks', function() {
	return Clicks.find();
    });

    Meteor.methods({
	goToExitSurvey: function() {
	    TurkServer.Instance.currentInstance().teardown();
	},
	incClicks: function() {
	    Clicks.update({}, {$inc: {count: 1}});
	    var asst = TurkServer.Assignment.currentAssignment();
	    asst.addPayment(0.1);
	},
    });

}
