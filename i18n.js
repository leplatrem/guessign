var i18n = {
  strings: {},
  language: {
    short: navigator.language.split('-')[0],
    long: navigator.language
  }
};

i18n.tr = function (str) {
    var strings = i18n.strings[i18n.language.long] || i18n.strings[i18n.language.short];
    if (!strings)
      return str;

    var translated = strings[str];
    if (!translated)
      return str;

    return translated;
};


i18n.strings['fr-FR'] = i18n.strings['fr'] = {
  'lang': 'Langue',
  'difficulty': 'Difficulté',
  'category': 'Catégorie',
  'font': 'Police',
  'lettercase': 'Casse',
  'choices': 'Choix',
  'lower': 'Minuscules',
  'first': 'Capitale',
  'upper': 'Majuscules'
};
