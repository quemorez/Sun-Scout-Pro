<<<<<<< HEAD
# SunScout G2 v14 G2 Path Map

Changes:
- PATH page on the G2 now renders a G2-friendly sun path map directly on the glasses
- the path map rotates with the phone heading
- Align and Path respond to phone heading once compass is enabled
- keeps location card, voice location, current location, page descriptions, and email export

Run:
```bash
npm install
npm run pack
vercel --prod
```
=======
# SunScout
### AR Sun Tracking HUD for Cinematographers  
Built for **Even Realities G2 Smart Glasses**

SunScout is a real-time **solar positioning tool designed specifically for filmmakers and photographers**.  
It runs on **Even Realities G2 AR glasses** and provides a minimal HUD that helps you understand where the sun is, where it will be, and how to align your camera for the best light.

The system combines:

• solar calculations  
• location data  
• device orientation  
• AR display  

to give cinematographers a **glanceable sun-tracking interface in the field.**

---

# Core Features

## Overview Panel
Provides a quick summary of solar conditions for the selected location and date.

Displays:

• Sunrise time  
• Sunset time  
• Morning golden hour (start → end)  
• Evening golden hour (start → end)  
• Sunrise azimuth (degrees relative to north)  
• Sunset azimuth  

This panel is designed to give a **fast overview of the day's lighting conditions**.

---

## Sun Now
Shows the **current position of the sun**.

Displays:

• Sun azimuth (direction in degrees)  
• Sun elevation (height above horizon)  
• Light relationship to camera

Light relationships include:

• Front light  
• 3/4 front  
• Side light  
• 3/4 back  
• Backlight

This allows cinematographers to quickly evaluate **lighting direction for a shot.**

---

## Align HUD
The Align feature helps you **physically rotate toward the sun**.

Displays:

• turn left / right instructions  
• alignment delta in degrees  
• pitch guidance

This is useful for:

• aligning camera for backlight
• matching previous shot direction
• planning silhouettes
• recreating lighting setups

The alignment uses **phone compass and orientation data**.

---

## Window
Identifies **the best shooting windows for backlight**.

SunScout scans the day in time intervals and finds when:

• the sun is behind the camera direction
• the sun elevation is within a useful range

Displays:

• best window  
• next best window  

This helps plan when to shoot **dramatic backlit scenes.**

---

## Path Page
The Path page displays a **sun path map directly on the G2 glasses**.

The diagram shows:

• sunrise position  
• sunset position  
• current sun position  
• horizon arc  
• user facing direction

Symbols:
R = sunrise direction
S = sunset direction
☉ = sun position

= user facing direction


The map **rotates with the phone's compass heading**, allowing the user to see where the sun will travel across the sky relative to their current orientation.

---

## Shadow
Estimates shadow behavior.

Displays:

• shadow direction  
• approximate shadow length ratio

This helps anticipate:

• building shadows
• terrain shadows
• lighting contrast

---

# Location System

SunScout allows location to be set in three ways.

## Saved Locations
Common locations are stored in the app.

Example:

• Hoboken  
• Marina Del Rey  
• Boulder  
• Moab  

---

## Search Location
Users can search any location.

Example:


Search: Monument Valley
Search: El Nido Philippines
Search: Krabi Thailand


The app uses **OpenStreetMap geocoding** to convert search text into coordinates.

---

## Current Location
Users can use GPS to automatically set the location.


Use Current Location


This retrieves device GPS coordinates and updates solar calculations instantly.

---

# Voice Commands

SunScout supports **voice location input**.

Supported commands:


Search for Los Angeles
Search for Monument Valley
Use current location


Voice commands automatically update solar calculations and refresh the HUD.

---

# Gesture Controls (G2 Glasses)

The app supports **tap gestures on the G2 glasses.**


Single Tap → Next Page
Double Tap → Next Location


Pages cycle in this order:


Overview
Sun Now
Align
Window
Path
Shadow


---

# Compass / Motion

SunScout uses the **phone's motion sensors**.

Used for:

• Align feature  
• Sun Path rotation  

Enable compass inside the app.


Enable Compass


This allows the Path map to rotate with your real-world orientation.

---

# Share Feature

SunScout can export the current solar data via email.

Includes:

• location
• date
• sun azimuth
• sun elevation
• sunrise / sunset
• golden hours
• best shooting windows
• shadow information

This is useful for sharing lighting plans with:

• directors
• cinematographers
• location teams

---

# Hardware

SunScout is designed for:

**Even Realities G2 Smart Glasses**

The glasses provide:

• AR text display  
• gesture input  
• connection to phone sensors  

---

# Intended Users

SunScout is designed for:

• cinematographers  
• directors  
• location scouts  
• photographers  
• drone pilots  

Anyone planning shots based on **natural sunlight.**

---

# Future Ideas

Potential future features:

• seasonal sun paths  
• moon tracking  
• AR horizon detection  
• building shadow projection  
• drone flight sun alignment  
• shot bookmarking

---

# Author

Zachary Quemore

Location Manager • Drone Pilot • VR Developer

Worked on productions including:

• Black Panther  
• Captain Marvel  
• The Revenant  
• Star Wars series  
• Transformers

---

# License

MIT License
>>>>>>> 226934761e9e46379c09ecb5065f82ed92fbbd61
