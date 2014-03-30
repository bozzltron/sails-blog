/**
 * BlogController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var async = require('async'),
	marked = require('marked'),
	moment = require('moment');

module.exports = {
    
  form: function(req, res) {
    return res.view('blog/create', {post:{
    	title: "",
    	body: "",
    	tags: "",
    	id: ""
    }});
  },

  create: function(req, res) {
  
  	var published = new Date()

  	if(req.body.id) {

		// Update blog
		Blog.findOne({_id:req.body.id}).done(function (err, blog) {

	      if (err) return res.send(err,500);
	      if (!blog) return res.send("No blogs with that id exists!", 404);
	      
	      blog.title = req.body.title;
	      blog.body = req.body.body;
	      blog.tags = req.body.tags;
	      blog.link = req.body.link;
	      blog.updated = published;
	      blog.userId = req.session.user;

	      // Persist the change
	      blog.save(function (err) {
	        if (err) return res.send(err,500);

	        // Report back with the new state of the chicken
	        req.flash("success", "Successfully update your blog.");
	
	        res.redirect('blog');
	      });

	  	});

  	} else {

	  	// Save the blog
		Blog.create({
		  title: req.body.title,
		  body: req.body.body,
		  tags: req.body.tags,
		  published: published,
		  userId: req.session.user 
		}).done(function(err, user) {

		  // Error handling
		  if (err) {
		    req.flash("danger", err);
		  	return res.redirect('blog/create');

		  // The User was created successfully!
		  }else {
		  	req.flash("success", "Successfully created a new blog!");
		  	return res.redirect('blog');
		  }
		});

	}

  },

  blog: function(req, res) {

  	var BlogController = this.sails.controllers.blog;
  
	async.parallel([

	    function(callback){

			// Get all blogs
			Blog.find({}).sort('published DESC').done(function(err, posts) {

		      // Format for display
		      _.each(posts, function(post){
		      	// Format dates
		      	post.createdAtDate = moment(post.published).format('MMMM Do, YYYY');
		      	post.createAtShortDate = moment(post.published).format('MMM D, YYYY');

		        // pass through the markdown processor
	      		post.body = marked(post.body);
		      });

			  // Error handling
			  if (err) {
			    return console.log(err);

			  // Found multiple users!
			  } else {
			    callback(null, posts);
			  }
			});

	    },
	    function(callback) { 

	    	// Get most recent blogs
		    BlogController._getblogs({}, 5, callback);

	    },
	    function(callback) {

	    	// Get tags
		    BlogController._gettags(callback);	

	    }
	],
	// optional callback
	function(err, results){
	    return res.view('blog/index', {posts: results[0], mostrecent: results[1], tag:false, tags:results[2]});
	});	

  },

  editForm: function(req, res) {
 
	// Update blog
	Blog.findOne({_id:req.param('id')}).exec(function (err, blog) {
      if (err) return res.send(err,500);
      if (!blog) return res.send("No blogs with that id exists!", 404);
      res.view('blog/create', {post:blog});
  	});
  },

  delete: function(req, res) {
  	// Lookup a user
	Blog.findOne({_id:req.param('id')}).done(function(err, blog) {

	  	// destroy the record
	  	blog.destroy(function(err) {
	    	// record has been removed
	    	req.flash("success", "Successfully delete your blog");
	    	res.redirect('blog');
	  	});

	});
  },

  importForm: function(req, res) {
	return res.view('blog/import');
  },

  import: function(importReq, importRes) {

	var FeedParser = require('feedparser')
	  , request = require('request');

	var success = 0, failure = 0, userId = importReq.session.user;

	var req = request(importReq.body.feed)
	  , feedparser = new FeedParser();

	req.on('error', function (error) {
	  // handle any request errors
	});
	req.on('response', function (res) {
	  var stream = this;

	  if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));

	  stream.pipe(feedparser);
	});


	feedparser.on('error', function(error) {
	  // always handle errors
	  console.log('error', error);
	});

	feedparser.on('readable', function() {
	  // This is where the action is!
	  var stream = this
	    , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
	    , item;

	  while (item = stream.read()) {
	    
	    var blog = {
	    	title : item.title,
	    	body : item.summary,
	    	link : item.link,
	    	published: item.pubDate,
	    	userId : userId,
	    	tags : ""
	    };
	   
	  	// Save the blog
		// For example
		Blog.create(blog).done(function(err, user) {

		  // Error handling
		  if (err) {
		  	failure++;

		  // The User was created successfully!
		  }else {
		  	success++;
		  }
		});

	  }

	});

	importReq.flash("info", "Imported " + success + " of " + (success+failure));
	importRes.redirect('/blog/import');

  },

  view: function(req, res) {

  	var BlogController = this.sails.controllers.blog;
  	
	async.parallel([

	    function(callback){

			// Get the specific blog post
			Blog.findOne({link:req.path}).done(function(err, post) {
		 
			  // Error handling
			  if (err) {
			    return console.log(err);

			  // Blog not found
			  } else if(!post){ 
			  	return;
			  // Blog found
			  } else {

		        // Format dates		       
			  	if(post.published) {
			  		post.createdAtDate = moment(post.published).format('MMMM Do, YYYY');
		  	    	post.createAtShortDate = moment(post.published).format('MMM D, YYYY');  
		  		}

	  	    	// pass through the markdown processor
	      		post.body = marked(post.body);

		  		callback(null,post);
			  }
			});

	    },
	    function(callback){

	    	// Get most recent blogs
		    BlogController._getblogs({}, 5, callback);

	    },
	    function(callback) {

	    	// Get tags
		    BlogController._gettags(callback);	

	    }
	],
	// optional callback
	function(err, results){
	    return res.view('blog/view', {post: results[0], mostrecent: results[1], tags: results[2]});
	});

  },

  rss: function(req, res) {

	// Get all blogs
	var BlogController = this.sails.controllers.blog;
	BlogController._getblogs({}, null, function(err, posts) {

       	_.each(posts, function(post) {

       		// pass through the markdown processor
	      	body = marked(post.body);

		  	if(post.published) {
		  		// Format date RFC822
		  		post.publishedDate = moment(post.published).format('ddd, DD MMM YYYY HH:mm:ss ZZ'); 
	  		}
  		});

		return res.view('blog/rss', {host: req.get('host'), posts: posts, _layoutFile:null});
	  
	});

  },

  tags: function(req, res) {

  	var BlogController = this.sails.controllers.blog;
  	BlogController._gettags(function(err, tags){
		return res.json(tags);
  	})

  },

  tag: function(req, res) {

  	var BlogController = this.sails.controllers.blog;
 
	async.parallel([

	    function(callback){

			// Get all blogs with the specified tag
			BlogController._getblogs({"tags" : req.param('tag')}, 5, function(err, blogs){

				// Format output
			    _.each(blogs, function(post){
			      	post.createdAtDate = moment(post.published).format('MMMM Do, YYYY');
			      	post.createAtShortDate = moment(post.published).format('MMM D, YYYY');
  				    // pass through the markdown processor
		      	 	post.body = marked(post.body);
			    });

			    callback(null, blogs);

			});

	    },
	    function(callback){

	    	// Get most recent blogs
		    BlogController._getblogs({}, 5, callback);

	    },
	    function(callback) {

	    	// Get tags
		    BlogController._gettags(callback);	

	    }
	],
	// optional callback
	function(err, results){
	    return res.view('blog/index', {posts: results[0], mostrecent: results[1], tag:req.param('tag'), tags:results[2]});
	});	

  },

  _gettags: function(callback) {

	// Get all tags
	Blog.find({tags:{$exists:true}}, {tags: 1 }).done(function(err, tags) {

	  // Error handling
	  if (err) {
	    return console.log(err);

	  // Found tags
	  } else {

	  	// Collect all user entered tags
	  	var allTags = [];
	  	_.each(tags, function(tag){
	  		_.each(tag.tags, function(postTag){
	  			allTags.push(postTag);
	  		});
	  	});
	  	
	  	// Filter to unique tags only
	  	var uniqTags = _.uniq(allTags);

       	callback(null, uniqTags);

	  }
	});

  },

  _getblogs: function(query, limit, callback) {

  	var limit = limit || false;

  	function response(err, posts) {

      // Error handling
      if (err) {
        return console.log(err);

      // Found multiple users!
      } else {
        callback(null, posts);
      }
    }

    if(limit) {
    	Blog.find(query).limit(limit).sort('published DESC').done(response);
    } else {
    	Blog.find(query).sort('published DESC').done(response);
    }

  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to BlogController)
   */
  _config: {},

  shortcuts: false
  
};
