var Browser = require("zombie");
var assert = require("assert");
var prompt = require('prompt');
var colors = require('colors');

prompt.message = "JiraJS".cyan;
prompt.delimiter = ":".green;

browser = new Browser({runScripts: true, loadCSS: false, waitDuration: '30s' })
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var jiraURL = "https://ideorl-vstts.ideorlando.org/"; // CHANGE THIS TO YOUR JIRA URL
var startedWork = new Array();

console.log("      _ _               _ ____   ".cyan);
console.log("     | (_)_ __ __ _    | / ___|  ".cyan);
console.log("  _  | | | '__/ _` |_  | \\___ \\  ".cyan);
console.log(" | |_| | | | | (_| | |_| |___) | ".cyan);
console.log("  \\___/|_|_|  \\__,_|\\___/|____/  ".cyan);
console.log("Version - 1.0".cyan);
console.log("By - Jt Whissel".green);
console.log("");

function promptLogin()
{
	 prompt.get([{
		      name: 'username',
		      required: true
		    }, {
		      name: 'password',
		      hidden: true,
		      conform: function (value) {
		        return true;
		      }
		    }], function (err, result) {

			    login(result.username,result.password);
  			})
}


function login(user, password)
{
	browser.visit(jiraURL+'login.jsp', function () {

			browser.fill("os_username", user).
			fill("os_password", password).
			pressButton("Log In", function() {
			  if(!browser.success|| browser.html(".aui-icon icon-error"))
			  {
			  	console.log("Username or Password is wrong".red);
			  	promptLogin();

			  }
			  else
			  {
			  	console.log("Access Granted!".green);
				 promptCMD();
			  }
			})



	});
}

function promptCMD()
{
	 prompt.get([{
		      name: 'logwork',
		      description: 'start or stop logging work?',
		      pattern: /^(start|stop)$/,
		      message: 'Must be \"start\" or \"stop\"',
		      required: true
		    }, {
		      name: 'jiraNumber'
		    }], function (err, result) {

			    if(result.logwork == "stop")
			    {
			    	prompt.get(['comment'], function (err, result2) {

			    		stopWork(result.jiraNumber, result2.comment);

			    	})
			    }
			    else
			    {
			    	startWork(result.jiraNumber);
			    }
  			})
}


function startWork(jiraNumber)
{
	browser.visit(jiraURL+"browse/"+jiraNumber, function () {
		if(browser.query("#login-form-submit"))
		{
			console.log("Ooops, looks like you were logged out. Please login again.".red)
			promptLogin();
		}
		else
		{
			console.log("Started Work on "+jiraNumber.green);
			startedWork[jiraNumber] = {start: new Date()}
			promptCMD();
		}
	});
}

function stopWork(jiraNumber, comment)
{
	if(startedWork[jiraNumber] != null)
	{
		var totalTime = Math.ceil((((new Date() - startedWork[jiraNumber].start)/1000)/60)/60); // this rounds up to the nearest hour.
			browser.visit(jiraURL+"browse/"+jiraNumber, function () {
			if(browser.query("#log-work-link"))
			{
				browser.clickLink("#log-work-link", function(){
					browser.fill("timeLogged",totalTime+"h").
								fill("comment",comment).
								pressButton("Log",function() {
										console.log("You worked for "+(totalTime).toString().green+" hours"+" on "+jiraNumber.green);
										startedWork[jiraNumber] = null;
										promptCMD();
								})
					})
			}
			else if (browser.query("#login-form-submit"))
			{
				console.log("Ooops, looks like you were logged out. Please login again.".red)
				promptLogin();
			}
		})
	}
	else
	{
		console.log("JiraJS must of shut down before you stopped your work.".red);
		console.log("You must now manualy \"Stop Progress\" on task ".red+jiraNumber.green+".".red);
		promptCMD();
	}
}

promptLogin();
