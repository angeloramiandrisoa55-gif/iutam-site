// Corrections du site IUTAM (à lancer dans le dossier du projet) :  node corrections-site.js
//  1) Version malagasy : langue de partage mg_MG au lieu de fr_FR  (tools/build-mg.js)
//  2) Carte « Ingéniorat » : « Bac + 3 requis » traduit pareil en malagasy (tools/mg.json)
// Sans danger : on peut le relancer, il ne change rien la 2e fois.

const fs = require("fs");

function corriger(fichier, remplacements) {
  let texte = fs.readFileSync(fichier, "utf8");
  let change = false;
  for (const [ancien, nouveau, deja] of remplacements) {
    if (deja.test(texte)) {
      console.log(fichier + " : déjà corrigé (" + deja.source.slice(0, 40) + "…)");
    } else if (ancien.test(texte)) {
      texte = texte.replace(ancien, nouveau);
      change = true;
      console.log(fichier + " : OK");
    } else {
      console.log(fichier + " : ATTENTION, ligne introuvable (" + ancien.source.slice(0, 40) + "…)");
    }
  }
  if (change) fs.writeFileSync(fichier, texte);
}

// 1) Langue de la version malagasy
corriger("tools/build-mg.js", [
  [/\.replace\('fr_MG', 'mg_MG'\)/, ".replace('fr_FR', 'mg_MG')", /\.replace\('fr_FR', 'mg_MG'\)/],
]);

// 2) Cohérence « Bac + 3 requis » (français) / malagasy
corriger("tools/mg.json", [
  [
    /("Bac \+ 3 requis"\s*:\s*)"Bakalorea \+ 5"/,
    '$1"Bakalorea + 3 takiana"',
    /"Bac \+ 3 requis"\s*:\s*"Bakalorea \+ 3 takiana"/,
  ],
]);

// Contrôle : le JSON doit rester valide
try {
  JSON.parse(fs.readFileSync("tools/mg.json", "utf8"));
  console.log("tools/mg.json : JSON valide");
} catch (e) {
  console.log("ERREUR : tools/mg.json n'est plus valide : " + e.message);
  process.exit(1);
}
