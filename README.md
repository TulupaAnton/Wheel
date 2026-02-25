# Wheel

A customizable **Wheel of Fortune** React component built with **SVG**.  
Designed as a clean UI layer that can be easily animated externally (GSAP, Web Animations API, Framer Motion, etc.).

Repository:  
https://github.com/TulupaAnton/Wheel/tree/main/Wheel

---

## Features

- SVG-based wheel with dynamic segments
- Configurable number of segments and labels
- Clean separation of UI and animation logic
- External control via `ref`
- CSS Modules for scoped styling
- High performance and mobile-friendly

---

## Tech Stack

- React
- SVG
- CSS Modules

---

## Folder Structure

```
Wheel/
├── Wheel.jsx            # Main Wheel component
├── Wheel.config.js      # Wheel configuration
├── Wheel.module.css     # Component styles
```

---

## Installation

### Local usage

Copy the `Wheel/` folder into your project and import the component:

---

## Configuration

Wheel configuration is defined in `Wheel.config.js`.

Typical options:

- `segmentsCount` — number of segments
- `segmentValues` — array of labels or prizes

⚠️ **Important:**  
`segmentValues.length` must match `segmentsCount`.

---

## Component API

### `ref`

The component forwards a `ref` to the root SVG/container element.

This allows external control of rotation and animation:

```js
wheelRef.current.style.transform = `rotate(${angle}deg)`
```

The component itself does **not** implement animation logic and is animation-library agnostic.

---

## Styling

All styles are located in `Wheel.module.css`.

You can customize:
- Wheel size and scaling
- Segment borders and gradients
- Metallic or glossy effects
- Text styles and alignment
- Shadows, glow, or highlights

---

## Performance Notes

For smooth 60 FPS animations, especially on mobile:

- Animate only the wheel container
- Use `transform: rotate()` for rotation
- Apply `will-change: transform` only during animation
- Avoid heavy SVG filters while rotating

---

## License

MIT

---

## Author

Anton Tulupa  
GitHub: https://github.com/TulupaAnton
