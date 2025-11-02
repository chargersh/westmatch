# Footer Navigation

## Overview

Bottom persistent navigation with 4 main sections (Hinge has 5, we skip "Standout" for now).

## Navigation Items

### 1. Discover (Hinge Icon)

- Main swiping/discovery screen
- Stack of cards from profiles
- Default landing page for authenticated users

### 2. Likes

- View users who liked you
- See who's interested
- Accept or pass on incoming likes

### 3. Messages

- Conversations with matches
- Real-time messaging
- List of active conversations

### 4. Profile

- User account settings
- Edit profile (photos, bio, preferences)
- Account management

## UI Properties

### Structure

- Fixed at bottom of screen
- Full width
- Border top separator
- 4 equally spaced items
- Mobile-optimized height

### Visual States

- **Active state:** Icon filled with color (icons themself filled with color, the svgs, maybe need to work with lucide somehow. Not the parent div that contains icons, but icons themself)
- **Inactive state:** Icon outline, muted color
- **Transition:** Smooth color/fill animation

### Icon Set

- Discover: Flame icon
- Likes: Heart icon
- Messages: MessageCircle icon
- Profile: Avatar component

## Skipped Items

- **Standout:** Premium feature, not in MVP
