var expect = require('chai').expect
require('../../index')

describe('Linker', function () {

	it('should link temper, pagelist_generator and flat_file_handler to the global enduro object', function () {
		expect(enduro).to.have.property('temper')
		expect(enduro).to.have.property('pagelist_generator')
		expect(enduro).to.have.property('flat_file_handler')
	})

	it('should link temper with the render function', function () {
		expect(enduro.temper).to.have.property('render')
	})

})
