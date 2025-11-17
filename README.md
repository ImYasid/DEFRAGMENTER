# 💾 DEFRAGMENTER: Clean Up the System!

## 💻 Proyecto Primer Bimestre

¡Tu disco duro se está fragmentando y solo tú puedes salvarlo! **Defragmenter** es un **Arcade Shooter** rápido y adictivo, construido desde cero con **HTML5 Canvas** y **JavaScript**.

Pilota tu programa antivirus a través de la **"Grid"** y dispara a las oleadas de **malware geométrico**. ¡La velocidad es la clave! Lucha contra enemigos en 3 oleadas de dificultad creciente que pondrán a prueba tus reflejos.

---

## ✨ Características Principales

* 🎯 **Arcade Shooter Top-Down:** Acción intensa sin pausa.
* 👾 **Enemigos Geométricos:** Lucha contra virus representados por geometría minimalista.
* 📈 **Progresión:** Sistema de **3 Oleadas** que aumentan progresivamente la dificultad.
* 🏆 **Persistencia:** Guarda tu puntuación máxima (*High Score*) usando `localStorage`.
* 🎧 **Audio Integrado:** Música de fondo y efectos de sonido para la acción.

---

## 🛠️ Stack Tecnológico

Este proyecto fue desarrollado cumpliendo con los requisitos de la asignatura *Aplicaciones Web*, utilizando tecnologías web nativas.

| Tecnología | Propósito |
| :--- | :--- |
| **HTML5** | Estructura base del *build* jugable. |
| **Canvas API** | Renderizado de gráficos 2D, animaciones y Game Loop. |
| **JavaScript (Vanilla JS)** | Lógica del juego, manejo de eventos y arquitectura modular. |

---

## 🚀 Cómo Jugar

### 🕹️ Controles

| Acción | Teclado/PC |
| :--- | :--- |
| **Movimiento** | Teclas **WASD** |
| **Disparar** | Tecla **Z**|


### ⚙️ Ejecución

Para iniciar el juego, solo necesitas abrir el archivo `index.html` en tu navegador web moderno preferido (Chrome, Firefox, Edge, Safari). No requiere un servidor local para la ejecución básica.

---
## 📂 Estructura del Proyecto

El proyecto está organizado en una estructura modular que separa el motor del juego, la lógica específica del juego y las bibliotecas de terceros.

```
DEFRAGMENTER/
├── assets/
│   ├── audio/
│   └── images/
├── engine/
│   ├── animation.js
│   ├── entity.js
│   ├── loader.js
│   └── stateManager.js
├── game/
│   ├── Audio.js
│   ├── Game.js
│   ├── Levels.js
│   └── mouse.js
├── lib/
│   ├── Box2dWeb-2.1.a.3.min.js
│   └── jquery.min.js
├── net/
│
├── index.html
├── main.js
├── README.md
└── styles.css
```

### 🔍 Descripción de Carpetas

* **assets/**: Contiene todos los recursos multimedia del juego.
    * `audio/`: Almacena la música de fondo (BGM) y los efectos de sonido (SFX) como `Fire.mp3`, `Explosion.mp3`, `GameOver.mp3`, etc.
    * `images/`: Almacena los íconos de la interfaz de usuario (HUD) y cualquier *sprite* visual del juego.

* **engine/**: El motor de juego base, con módulos genéricos y reutilizables.
    * `animation.js`: Polyfill para `requestAnimationFrame` que asegura que las animaciones se ejecuten de forma fluida en el navegador.
    * `entity.js`: Define las clases base para todas las entidades del juego (`Entity`, `Player`, `Bullet`, `Boss`, `Explosion`).
    * `loader.js`: Maneja la precarga de todos los archivos en `assets/` antes de que comience el juego.
    * `stateManager.js`: (Se asume) Gestiona los diferentes estados del juego (ej. Menú, Jugando, Pausa, Game Over).

* **game/**: Contiene toda la lógica y reglas específicas de "DEFRAGMENTER".
    * `Audio.js`: Define el objeto `audioManager` para cargar, reproducir y detener toda la música y SFX.
    * `Game.js`: El corazón del juego. Contiene el objeto principal `game`, el bucle `animate()`, la lógica de estado (`rsgState`), el manejo de colisiones y la inicialización.
    * `Levels.js`: Define los datos de cada nivel (oleada) y maneja la pantalla de selección de niveles.
    * `mouse.js`: (Se asume) Manejador para la entrada del mouse, aunque el juego principal usa teclado.

* **lib/**: Bibliotecas y *frameworks* de terceros.
    * `Box2dWeb.min.js`: Un motor de físicas 2D (actualmente no implementado, pero disponible).
    * `jquery.min.js`: Se utiliza para la manipulación sencilla del DOM (mostrar/ocultar menús, asignar eventos a botones).

* **net/**: Carpeta vacía reservada para futuras funcionalidades de red.

---

### 📄 Archivos Principales

* **index.html**: El punto de entrada de la aplicación. Define la estructura HTML (incluyendo el `<canvas>`) y carga todos los archivos CSS y JavaScript en el orden correcto.
* **main.js**: Un script simple que espera a que la ventana cargue y luego llama a `game.init()` para iniciar todo el proceso.
* **styles.css**: Contiene todos los estilos visuales para los menús (`.gamelayer`), el HUD (`#scorescreen`), la pantalla final (`#endingscreen`) y la apariencia general del juego.

---

## 🧑‍💻 Desarrolladores

**Michael y Yasid**
* **Asignatura:** Aplicaciones Web
* **Institución:** EPN

---
