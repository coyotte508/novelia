const _ = require("lodash");

var categories = {
  martial: {
    name: "Martial Art",
    icon: "", 
    description: ""
  },
  fantasy: {
    name: "Fantasy",
    icon: "", 
    description: ""
  },
  modernFantasy: {
    name: "Modern Fantasy",
    icon: "", 
    description: ""
  },
  military: {
    name: "Military",
    icon: "", 
    description: ""
  },
  historical: {
    name: "Historical",
    icon: "", 
    description: ""
  },
  scifi: {
    name: "Sci-fi",
    icon: "", 
    description: ""
  },
  game: {
    name: "Game (VR)",
    icon: "", 
    description: ""
  },
  sport: {
    name: "Sport",
    icon: "", 
    description: ""
  },
  romance: {
    name: "Romance",
    icon: "", 
    description: ""
  },
  mystery: {
    name: "Mystery / Horror",
    icon: "", 
    description: ""
  },
  detective: {
    name: "Detective",
    icon: "", 
    description: ""
  },
  fanfic: {
    name: "Fanfic",
    icon: "", 
    description: ""
  },
  drama: {
    name: "Drama",
    icon: "",
    description: ""
  }
};

var categoryList = (function(){
  var ret = [];
  for (var key in categories) {
    ret.push(_.extend({shortand: key}, categories[key]));
  }
  return ret.sort((a,b) => a.name.localeCompare(b.name));
})();

var Category = (function(){

  return this;
})();

Category.find = function(cat) {
  if (cat in categories) {
    return Promise.resolve(categories[cat]);
  }
  return Promise.reject(`Category "${cat}" not found`);
}

Category.list = function() {
  return categoryList;
}

module.exports = Category;