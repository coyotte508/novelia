export interface CategoryDocument {
  name: string;
  icon: string;
  description: string;
  shorthand?: string;
}

const categories: {[category: string]: CategoryDocument} = {
  martial: {
    name: "Martial Art",
    icon: "",
    description: "Martial art stories may take place in any kind of world or background but has the martial art as a key-element of the story."
  },
  fantasy: {
    name: "Fantasy",
    icon: "",
    description: `Fantasy stories take place in imaginary worlds, often without relations to any locations, events, or people from the real world. The notion of magic or supernatural elements are most of the time present, as well as magical creatures. A fantasy story is predominantly of the medievalist form and commonly subcategorized as "high fantasy".`
  },
  modernFantasy: {
    name: "Modern Fantasy",
    icon: "",
    description: `Often subcategorized as "low fantasy", modern fantasy stories take place in real or parallel world in modern era with a presence of supernatural elements such as magic, magical creatures or phenomena.`
  },
  military: {
    name: "War & Military",
    icon: "",
    description: "War or military stories revolve around fictional or non-fictional war stories and retrace the story of protagonists in a war (or several wars)."
  },
  historical: {
    name: "Historical",
    icon: "",
    description: "Historical fictions retrace periods or events in the past, the History, as how they were or rewrite them."
  },
  scifi: {
    name: "Sci-fi",
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
  horror: {
    name: "Mystery & Horror",
    icon: "",
    description: "Horror are intended to inspire to frighten, scare, or startle the readers. They often focus on elements of death, afterlife, and evil. They are often supernatural, but do not have to be."
  },
  detective: {
    name: "Detective",
    icon: "",
    description: "Detective stories involve a mysterious crime or case to be solved."
  },
  fanfic: {
    name: "Fanfic",
    icon: "",
    description: "A fanfiction involving characters or elements from a popular work."
  },
  drama: {
    name: "Drama",
    icon: "",
    description: ""
  },
  litrpg: {
    name: "LitRPG",
    icon: "",
    description: "LitRPG encompasses the modern tropes coming from Asia such as reincarnation in another world with a status cheat."
  },
  game: {
    name: "Game",
    icon: "",
    description: "Game stories are stories taking place in a virtual world (ex. VRMMO) with or without video game elements."
  }
};

const categoryList = (() => {
  const ret = [];
  for (const key of Object.keys(categories)) {
    categories[key].shorthand = key;
    ret.push(Object.assign({}, categories[key]));
  }
  return ret.sort((a, b) => a.name.localeCompare(b.name));
})();

const toExport = {
  find(shorthand: string): Promise<CategoryDocument> {
    if (shorthand in categories) {
      return Promise.resolve(categories[shorthand]);
    }
    return Promise.reject(`Category "${shorthand}" not found`);
  },

  list(): Promise<CategoryDocument[]> {
    return Promise.resolve(categoryList);
  }
};

export default toExport;
