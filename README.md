<div id="ExoFlex Architecture Informatique" align="center">
   <h1>ExoFlex Architecture Informatique</h1>
    
 [![Arduino Build](https://github.com/EDP325/ExoFlex/actions/workflows/Arduino_test.yml/badge.svg)](https://github.com/EDP325/ExoFlex/actions/workflows/Arduino_test.yml)
[![Code Formatting](https://github.com/BigJack325/ExoFlex/actions/workflows/code_formatting.yml/badge.svg)](https://github.com/BigJack325/ExoFlex/actions/workflows/code_formatting.yml)
 [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](https://github.com/EDP325/ExoFlex/blob/main/LICENSE.md)

</div>

ExoFlex Architecture Informatique présente tous les informations en lien avec l'architecture informatique

## Choix microcontrôler

Cette section résume les recherches effectuées au sujet du choix de microcontrôler

### STM32

- Très utilisé dans les systemes médicaux

- Il existe beaucoup de kits différents que l'on peut adapter selon nos besoins (Plus de performance et fiabilité)

- Possible dans le futur de s'en faire un encore plus custom pour notre utilisation

- Utilise un IDE plus robuste et ayant plus de fonctionnalité que Arduino IDE (Stm32CubeIde)

**Conclusion: Nous choisissons le STM32..... . Ceci implique donc que le langage utilisé pour l'architecture robotique sera du C**

_Note: Les spécifications électriques du STM32..... se retrouvent dans le [README.md](https://github.com/ExoFlex-Inc/ExoFlex/blob/main/ExoFlex_%C3%89lectrique/README.md) électrique\_

<img src="https://botland.store/img/art/inne/19373_4.jpg" alt="image" width="533" height="300"/>

## Interface utilisateur

Cette section résume les recherches effectuées au sujet de l'interface utilisateur

### Type d'écran

#### LCD

à remplir

#### Page HTML

à remplir

#### Application mobile

à remplir

## Procédure de tests locale

Cette section explique les différentes procédure de tests

## Installation

Cette section présente comment bien setup son ordinateur

### Stm32CubeIde

(Procédure installation du logiciel et setup du pour le code)

à remplir

## Code release

Cette section explique les étapes à suivre pour faire un release

### Procédure

À partir de maintenant lorsque du code sera poussé sur une branche il sera important de suivre ce format de message pour pouvoir visionner tous les features et fix qui ont été fait depuis le dernier release.

| Format de message                                          | type de release        |
| ---------------------------------------------------------- | ---------------------- |
| fix(pencil): message                                       | Fix release/patch      |
| feat(pencil): message                                      | Feature/Minor release  |
| perf(pencil): message <br> <br> BREAKING CHANGE: (message) | Breaking/Major release |

Comme on peut le constater dans le tableau ci-haut, on doit se rappeler de plusieurs mots clés lorsqu'un nouveau feature ou un fix est fait dans le code.

- Le mot clé fix est utilisé pour dire que la modification qui à été fait est la correction d'un bug dans le code.
- Le mot clé feat est utilisé pour dire qu'une nouvelle fonctionnalité a été ajouté dans une application quelconque. On pourrait associer un feat à une story jira par example, car ce n'est pas une grosse modification.
- Le mot clé perf est utilisé pour dire qu'une nouvelle fonctionnalité majeure a été ajouté dans une application quelconque. On pourrait associer un perf à un epic jira par example, car c'est une grosse modification.
- Le mot clé "pencil" peut être remplacer par le npm package qui sera affecté par les changements apportés dans le code. Le "pencil" est optionnel et est seulement utilisé dans le cas ou un npm package est affecté.
- Le mot clé "message" peut être remplacer par le message qui est habituellement écris lors d'un commit. Attention le message doit être détaillé et compréhensible pour quelqu'un qui n'est pas familier avec le code. Il doit être écrit comme si vous présentez de l'information à un client et lui donner une idée des fixs et features qui ont été apporté depuis la nouvelle mise à jour.
- Le "BREAKING CHANGE" est utilisé lorsqu'un nouveau feature d'implémenté risque de ne pas fonctionner avec les versions antérieurs. Le message à l'intérieur du "BREAKING CHANGE" spécifie les potentiels fonctionnalité, module ou composante qui risque de ne pas être compatible. Il est utilisé pour guidé les développeurs à régler les potentiels problèmes de compatibilité. Souvent on retrouve le "BREAKING CHANGE" dans les Majors releases et ce mot clé est optionel.

### Example de message commit

Le format de message qu'on utilise pour les releases est seulement applicable lorsqu'un ticket est terminé et qu'il est prêt d'être en pull request. Pour tout autre commit vous pouvez seulement écrire le message que vous avez l'habitude de faire.

- Dans cet example, disons que le code du IMU est finalisé pour le mouvement de la dorsiflexion et éversion. Alors le message du commit ressemblerait à ceci:
- feat: Intégration d'un capteur IMU pour connaitre la position du pied dans l'espace.
- Dans cette situation il s'agit d'un feat, car on parle seulement d'un capteur qui est relié au mouvement d'éversion et de dorsiflexion.
- Si on parle de l'intégralité de tous les capteurs et code associé à ces deux mouvements, alors on aurait utilisé le mot-clé perf.

### Démarrage du workflow des releases

Lorsque votre branche sera merger au main il ne faut pas oublier d'aller démarrer le worflow du release. Vous devez vous rendre dans la section actions de github et clicker sur Release.
![Alt text](image.png)
Ensuite clicker sur Run workflow:
![Alt text](image-1.png)
![Alt text](image-2.png)
