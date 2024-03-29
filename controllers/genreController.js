var Genre = require('../models/genre');
var async = require('async');
var Book = require('../models/book');

var debug = require('debug')('genre');

const { body,validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
    // res.send('NOT IMPLEMENTED: Genre list');

    Genre.find()
        .sort([['name', 'ascending']])
        .exec( function (err, list_genres) {
          if (err) { // Error in API usage.
            debug('update error:' + err);
            return next(err);
        }
            // Succesful, so render.
            res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
        } );
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    // res.send('NOT IMPLEMENTED: Genre detail: ' + req.params.id);

    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function (callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        // Reportando errores
        if (err) { // Error in API usage.
          debug('update error:' + err);
          return next(err);
      }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
    // res.send('NOT IMPLEMENTED: Genre create GET');

    res.render('genre_form', { title: 'Create Genre' });
    
};

// Handle Genre create on POST.
// exports.genre_create_post = function(req, res) { res.send('NOT IMPLEMENTED: Genre create POST'); };
exports.genre_create_post =  [
   
    // Validate that the name field is not empty.
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),
    
    // Sanitize (escape) the name field.
    sanitizeBody('name').escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a genre object with escaped and trimmed data.
      var genre = new Genre(
        { name: req.body.name }
      );
  
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
        return;
      } else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Genre.findOne({ 'name': req.body.name })
          .exec( function(err, found_genre) {
            if (err) { // Error in API usage.
              debug('update error:' + err);
              return next(err);
          }
            if (found_genre) { // Genre exists, redirect to its detail page.
               res.redirect(found_genre.url);
             } else {
               genre.save(function (err) {
                if (err) { // Error in API usage.
                  debug('update error:' + err);
                  return next(err);
              }
                 // Genre saved. Redirect to genre detail page.
                 res.redirect(genre.url);
               });
            }
          });
      }
    }
  ];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
    // res.send('NOT IMPLEMENTED: Genre delete GET');

  async.parallel({
    genre: (callback) => {
      Genre.findById(req.params.id).exec(callback)
    },
    genre_books: (callback) => {
      Book.find({ 'genre': req.params.id }).exec(callback)
    },
  }, (err, results) => {
    if (err) { // Error in API usage.
      debug('update error:' + err);
      return next(err);
  }
    if (results.genre==null) { // No results.
      res.redirect('/catalog/genres')
      return;
    }
    res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books })
  })

};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {
    // res.send('NOT IMPLEMENTED: Genre delete POST');

  async.parallel({
    genre: (callback) => {
      Genre.findById(req.body.genreid).exec(callback)
    },
    genre_books: (callback) => {
      Book.find({ 'genre': req.body.genreid }).exec(callback)
    },
  }, (err, results) => {
    if (err) { // Error in API usage.
      debug('update error:' + err);
      return next(err);
  }
    if (results.genre_books > 0) {
      res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books })
      return;
    } else {
      Genre.findByIdAndRemove(req.body.genreid, function deleteBook (err) {
        if (err) { // Error in API usage.
          debug('update error:' + err);
          return next(err);
      }
        // Succes, so redirect.
        res.redirect('/catalog/books')
      })
    }
  })

};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    // res.send('NOT IMPLEMENTED: Genre update GET');

    Genre.findById(req.params.id)
      .exec( (err, genre) => {
        if (err) { return err; }
        // Successful, so render.
        res.render('genre_form', { title: 'Update Genre', genre: genre });
      })

};

// Handle Genre update on POST.
// exports.genre_update_post = function(req, res) { res.send('NOT IMPLEMENTED: Genre update POST'); };
exports.genre_update_post = [

  // Validate fields.
  body('name', 'Genre name required.').isLength({ min: 1 }).trim(),

  // Sanitize fields.
  sanitizeBody('name').escape(),

  // Process request after validated and sanitize data.
  (req, res, next) => {
    
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre({ 
      name: req.body.name,
      _id: req.params.id // This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      res.render('genre_form', { title: 'Update Genre', genre: genre });
      return;
    } else {

      // Verify if there are other genre as this
      Genre.findOne({ 'name': req.body.name }).exec( (err, found_genre) => {
        if (err) { // Error in API usage.
          debug('update error:' + err);
          return next(err);
      }

        if (found_genre) {
          // Genre exists, redirect to its detail page.
          res.redirect(found_genre.url);
          return;
        } else {
          Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
            if (err) { // Error in API usage.
              debug('update error:' + err);
              return next(err);
          }
            // Success - so redirect.
            res.redirect(thegenre.url);
          });
        }
      } )

    }

  }
];