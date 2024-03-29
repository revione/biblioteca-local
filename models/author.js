var mongoose = require('mongoose'),
    moment = require('moment');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
  {
    first_name: {type: String, required: true, max: 100},
    family_name: {type: String, required: true, max: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
  }
);

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function () {
  return this.family_name + ', ' + this.first_name;
});

// Virtual for author's lifespan
AuthorSchema
.virtual('lifespan')
.get(function () {
  return (this.date_of_death.getYear() - this.date_of_birth.getYear()).toString();
});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});

// Virtual for date of birth formatted
AuthorSchema
  .virtual('date_of_birth_formatted')
  .get( function () {
    return moment.utc(this.date_of_birth).format('YYYY-MM-DD')
} );

// Virtual for date of birth formatted
AuthorSchema
  .virtual('date_of_death_formatted')
  .get( function () {
    if ( this.date_of_death === null || this.date_of_death === undefined ) {
      return '';
    } else {
      return moment.utc(this.date_of_death).format('YYYY-MM-DD')
    }
} );

//Export model
module.exports = mongoose.model('Author', AuthorSchema);