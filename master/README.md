# ExoFlex Architecture Informatique

ExoFlex Architecture Informatique présente tous les informations en lien avec l'architecture informatique 

## Choix microcontroller

Cette section résume les recherches effectuées au sujet du choix de microcontroller

### ROS sur un raspberry Pi

- ROS est une librairie de contrôle robotique qui offre une variété de type de contrôle ansi qu'une grande modularité

- ROS est également très utile pour la visualisation d'environnement avec capteurs et caméras (Pas très utile dans notre cas)

- L'utilisation de cette librairie serait sur un raspberry pi connecté à un microcontroller

**Conclusion: On ne choisi pas ROS puisque c'est overkill pour notre utilisation**

<img src="https://www.zdnet.com/a/img/resize/2f3709d5d1474a5d20d535a9cf6174198a2368d1/2021/06/11/a419ab3e-428b-40fa-b554-02a18831fce3/raspberry-pi-4-model-b-header.jpg?auto=webp&fit=crop&height=675&width=1200" alt="image" width="533" height="300"/>

### ESP32

- Microcontrolleur très versatile avec sa connection wifi et bluetooth 

- Il peut créer des firmware custom (Ex MicroRos) et aussi être programmer avec Arduino IDE ou platformeIO

- Il est performant, mais on aimerait chercher plus de performance, de fiabilité et de versatilité pour une machine médicale

**Conclusion: Le manque de performance et de fiabilité nous font rejeter l'ESP32**

<img src="https://www.az-delivery.de/cdn/shop/products/esp32-nodemcu-module-wlan-wifi-development-board-mit-cp2102-nachfolgermodell-zum-esp8266-kompatibel-mit-arduino-872375_1024x.jpg?v=1679400491" alt="image" width="533" height="300"/>

### STM32

- Très utilisé dans les systemes médicaux

- Il existe beaucoup de kits différents que l'on peut adapter selon nos besoins (Plus de performance et fiabilité)

- Possible dans le futur de s'en fair un encore plus custom pour notre utilisation

- Utilise un IDE plus robuste et ayant plus de fonctionnalité que Arduino IDE (Stm32CubeIde)

**Conclusion: Nous choisissons le STM32..... . Ceci implique donc que le langage utilisé pour l'architecture robotique sera du C**

_Note: Les spécifications électriques du STM32..... se retrouve dans le [README.md](https://github.com/ExoFlex-Inc/ExoFlex/blob/main/ExoFlex_%C3%89lectrique/README.md) électrique_

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

## Procédure de tests

Cette section explique les différentes procédure de tests 

### Github actions

à remplir

## Installation

Cette section présente comment bien setup son ordinateur

### Stm32CubeIde

à remplir

### Ouverture du projet

à remplir

### Dependencies à installer ?

à remplir

## Code release

Cette section explique les étapes à suivre pour faire un release

### Procédure

à remplir





