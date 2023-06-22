# ExoFlex Électrique

ExoFlex Électrique est la référence à toutes les questions en lien avec les composantes et les schémas électriques.

## Description des capteurs

### Capteur de pression

Les capteurs de pression seront essentiellement utilisé avec les sangles qui seront conçues par l'équipe mécanique. Ce capteur va permettre de vérifier la pression entre la sangle et la jambe du patient afin de procurer un confort à l'utilisateur.

```

```

### IMU

L'IMU utilisé aura un accéléromètre et un gyroscope d'intégré à celui-ci. Ce capteur va nous permettre de spécifier des repères pour déterminer les positions cibles à atteindre lors des étirements. Le capteur qui sera utilisé pour le banc de test sera le MPU6050 fabriqué par DFROBOT.

![image](https://github.com/BigJack325/ExoFlex/assets/73359212/51f4c0cc-e2a4-479d-a6a5-8a7eece18c7c)

- La tension opérationnelle sera de 3 à 5V (Vin)
- Mise à la terre (GND)
- Communication i2c (sda et scl)
- interrupt(INT)

### Capteur de fin de course

Ces capteurs seront utilisés pour arrêter les mouvements du robot si jamais il vient à dépasser la limite physique imposé. Ici on utilise des limit switch avec le numéro de modèle: SPDT 1NO 1NC fabriqué par InduSKY.

![image](https://github.com/BigJack325/ExoFlex/assets/73359212/40596548-077f-4a1c-9eb3-c136ed482659)

### Potentiomètre

Les potentiomètres rotatifs vont nous servir à déterminer l'angle des joints, afin de faire un suivit du mouvement du robot. Ici on utilise les potentiomètres fabriqué par OSEPP ELECTRONICS.

![image](https://github.com/BigJack325/ExoFlex/assets/73359212/f433d403-7925-4e5d-81b4-6cf97565363a)

## Descriptions des actuateurs

à remplir

## Overview schéma électrique et conception PCB

### Arduino et alimentation
![Alt text](image.png)

### Capteurs
![Alt text](image-1.png)