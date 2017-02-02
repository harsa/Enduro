// * ———————————————————————————————————————————————————————— * //
// * 	save cms
// *
// * 	admin api endpoint admin_api/save_cms
// *	@param {string} sid - session id stored in cookie on client
// *	@param {string} filename - name of the cms file. relative to cms/
// *	@param {string} content - content of the cms updated file - will be converted to js object and formated upon save
// *	@return {response} - success boolean and saved cms' file content
// * ———————————————————————————————————————————————————————— * //
var api_call = function () {}

// local dependencies
var flat_file_handler = require(ENDURO_FOLDER + '/libs/flat_utilities/flat_file_handler')
var admin_sessions = require(ENDURO_FOLDER + '/libs/admin_utilities/admin_sessions')
var juicebox = require(ENDURO_FOLDER + '/libs/juicebox/juicebox')
var logger = require(ENDURO_FOLDER + '/libs/logger')
var admin_rights = require(ENDURO_FOLDER + '/libs/admin_utilities/admin_rights')
var request = require("request")
// routed call
api_call.prototype.call = function (req, res, enduro_server) {

	var jsonString = ''
	req.on('data', function (data) {
		jsonString += data
	})

	req.on('end', function () {

		jsonString = JSON.parse(jsonString)

		// gets parameters from query
		var sid = jsonString.sid
		var filename = jsonString.filename
		var content = jsonString.content

		// makes sure all required query parameters were sent
		if (!sid || !filename || !content) {
			res.send({success: false, message: 'Parameters not provided'})
			return logger.err('parameters not provided')
		}

		var requesting_user

		//#resq-web
		var slackHook = "https://hooks.slack.com/services/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"

		var sendSlack = function(text){
			request.post(
				slackHook,
				{ json: {
					"username": "cms bot",
					"icon_emoji": ":ghost:",
					"text": text
					}
				},
				function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log(body)
					}
				}
			);
		}

		admin_sessions.get_user_by_session(sid)
			.then((user) => {
				if (!admin_rights.can_user_do_that(user, 'write')) {
					res.sendStatus(403)
					throw new Error()
				}

				requesting_user = user
				return flat_file_handler.save(filename, content)
			}, () => {
				res.sendStatus(401)
				throw new Error()
			})
			.then(() => {
				return juicebox.pack(requesting_user.username)
			}, () => { throw new Error() })
			.then((data) => {
				// re-renders enduro - essential to publishing the change
				enduro_server.enduro_refresh(() => {
					sendSlack("Page " + filename + " saved by " +  requesting_user.username);
					res.send(data)
				})
			}, () => {})
	})

}

module.exports = new api_call()
