/**
 * Blog
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
  	
  	/* e.g.
  	nickname: 'string'
  	*/
    tag : ""
    
  },

  beforeCreate: function (attrs, next) {

  	// Save tags as an array
    if(attrs.tags) {
    	attrs.tags = attrs.tags.replace(/\s+/g, '').split(",");
    }

    var date = new Date();

    // Build a fancy url from the title
    var title = attrs.title;

    // Replace spaces with
    title = title.replace(/\s+/g, '-');

    // set to all lower case
    title = title.toLowerCase();

    // remove all special chars
    title = title.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');

    // Generate fancy url
    attrs.link = '/' + ['blog', date.getFullYear(),  date.getMonth() + 1, title].join('/');

    next();
  },    

  beforeUpdate: function (updated, next) {
  	// Save tags as an array
    if(updated.tags) {
    	updated.tags = updated.tags.replace(/\s+/g, '').split(",");
    }
    next();
  },    

};
