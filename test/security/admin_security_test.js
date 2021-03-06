// vendor dependencies
var expect = require('chai').expect
var rewire = require('rewire')

// local dependencies
var enduro = require(ENDURO_FOLDER + '/index')
var flat_file_handler = require(ENDURO_FOLDER + '/libs/flat_utilities/flat_file_handler')
var admin_security = require(ENDURO_FOLDER + '/libs/admin_utilities/admin_security')

// rewired
var internal_admin_security = rewire(ENDURO_FOLDER + '/libs/admin_utilities/admin_security')

describe('Admin security', function () {

	// create a new project
	before(function (done) {
		enduro.run(['create', 'admin_security'])
			.then(() => {
				// navigate inside new project
				global.CMD_FOLDER = CMD_FOLDER + '/admin_security'
				done()
			}, () => {
				done(new Error('Failed to create new project'))
			})
	})

	it('should return empty list when all users requested before any was created', function (done) {
		admin_security.get_all_users()
			.then((users) => {
				expect(users).to.be.empty
				done()
			})
	})

	it('should add root admin successfully', function (done) {
		enduro.run(['addadmin'])
			.then(() => {
				return flat_file_handler.load('.users')
			}, () => {
				done(new Error('failed to add admin'))
			})
			.then((users) => {
				expect(users.users[0]).to.have.property('username', 'root')
				expect(users.users[0]).to.have.property('salt')
				expect(users.users[0]).to.have.property('hash')
				expect(users.users[0]).to.have.property('user_created_timestamp')
				done()
			})
			.then(() => {}, () => {
				done(new Error('Failed to detect all the required properties for admin'))
			})
	})

	it('should add admin with custom name successfully', function (done) {
		enduro.run(['addadmin', 'gottwik', '123'])
			.then(() => {
				return flat_file_handler.load('.users')
			}, () => {
				done(new Error('failed to add admin'))
			})
			.then((users) => {
				expect(users.users[1]).to.have.property('username', 'gottwik')
				expect(users.users[1]).to.have.property('salt')
				expect(users.users[1]).to.have.property('hash')
				expect(users.users[1]).to.have.property('user_created_timestamp')
				done()
			})
			.then(() => {}, () => {
				done(new Error('Failed to detect all the required properties for admin'))
			})
	})

	it('should not be possible to add user with an already existing username', function (done) {
		enduro.run(['addadmin', 'gottwik', '123'])
			.then(() => {
				done(new Error())
			}, () => {
				done()
			})
	})

	it('should find user by username', function (done) {
		admin_security.get_user_by_username('gottwik')
			.then((user) => {
				expect(user).to.have.property('username', 'gottwik')
				expect(user).to.have.property('salt')
				expect(user).to.have.property('hash')
				expect(user).to.have.property('user_created_timestamp')
				done()
			})
	})

	it('should not find user if username does not exist', function (done) {
		admin_security.get_user_by_username('ggottwik')
			.then((user) => {
				done(new Error('Failed to detect non-existent user'))
			}, () => {
				done()
			})
	})

	it('should get all users', function (done) {
		admin_security.get_all_users()
			.then((users) => {
				expect(users).to.be.instanceof(Array)
				expect(users).to.have.lengthOf(2)
				expect(users).include.members(['root', 'gottwik'])
				done()
			})
	})

	it('should be able to login by password', function (done) {
		admin_security.login_by_password('gottwik', '123')
			.then(() => {
				done()
			}, () => {
				done(new Error())
			})
	})

	it('should not be able to login without password', function (done) {
		admin_security.login_by_password('gottwik')
			.then(() => {
				done(new Error())
			}, () => {
				done()
			})
	})

	it('should be able to detect wrong password', function (done) {
		admin_security.login_by_password('gottwik', '1234')
			.then(() => {
				done(new Error())
			}, (response) => {
				expect(response.message).to.contain('wrong password')
				done()
			})
	})

	it('should be able to detect wrong username', function (done) {
		admin_security.login_by_password('gottwikgfd', '1234')
			.then(() => {
				done(new Error())
			}, (response) => {
				expect(response.message).to.contain('wrong username')
				done()
			})
	})

	it('should not be possible to hash and salt if either parameters are missing', function () {
		expect(internal_admin_security.__get__('salt_and_hash')()).to.be.empty
	})

	// navigate back to testfolder
	after(function () {
		global.CMD_FOLDER = process.cwd() + '/testfolder'
	})
})
