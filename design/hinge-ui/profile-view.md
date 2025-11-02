# Profile View UI

## Overview

The profile screen displays user information in a card-based layout that combines visual elements with text information, allowing for granular interaction through individual content likes rather than whole-profile likes.

---

## Profile Header Section

### User Information Stack

**Structure**

```
Name (primary, large font)
she/her (pronouns, secondary, smaller font)
```

**Visual Properties**

- Left alignment
- High contrast for readability
- Name as primary visual element
- Pronouns in muted color, smaller size

---

## Profile Content Cards

### Card Layout Pattern

**Sequence alternation**: Image Card → Prompt Card → Info Card → Image Card → Prompt Card Image Card → Prompt Card and etc.

**General Card Properties**

- Full-width content cards
- Subtle card shadows/elevation
- Consistent spacing between cards
- Smooth scrolling interaction
- Rounded corners for visual cohesion

### 1. Profile Photo Card

**Image Display**

- **Dimensions**: Square format (1:1 aspect ratio)
- **Content**: First image from user's profile (dragged first in settings)
- **Like Button**: Bottom-right corner (of course with some space from the edges), semi-transparent background
- **Interaction**: Tap to open like modal with photo as focus

### 2. Prompt Card

**Content Structure**

```
[Prompt Text]        // Smaller, muted text (the question)
[User's Answer]      // Larger, emphasized text (the response)
```

**Visual Properties**

- **Height**: Shorter than image cards (content-driven height)
- **Typography**: Prompt in secondary color/size, Answer in primary
- **Like Button**: Bottom-right corner, maintains consistency with photo cards
- **Background**: Subtle card background, distinct from image cards

**Content Display**

- Prompt text displayed in muted color, smaller font
- User's answer in larger, bolder typography
- Responsive text sizing for readability
- Truncation with "read more" for very long answers

### 3. Personal Information Card

**Information Categories**

- Education/University
- Lifestyle preferences (drinking, smoking, etc.)
- Physical attributes (height, age)
- Other demographic details

**Layout Structure**

```
[Category Heading]
├─ Item 1 • Item 2 • Item 3
├─ Item 4 • Item 5
└─ Item 6
```

**Visual Properties**

- **Separators**: Horizontal dividers between information groups
- **Bullet points**: Centered bullets (•) between related items
- **Typography**: Clear hierarchy with category headers
- **Spacing**: Comfortable line height for readability
- **No like functionality**: Information-only card

**Information Groups**

- **Basic**: Age, Height, Location
- **Education**: University, Major, Graduation Year
- **Lifestyle**: Drinking, Smoking, Diet, Exercise
- **Preferences**: Relationship type, Children, Pets

---

## Individual Like System

### Like Button Design

**Location**: Bottom-right corner of image and prompt cards
**Appearance**:

- Semi-transparent background with border
- Heart icon
- Appear on hover/touch interaction
- Subtle hover animation

**Interaction Flow**:

1. User taps like button on photo/prompt card
2. Modal opens with blurred background
3. Focused content displayed prominently
4. Text input available for personalized message
5. Send or Cancel options provided

### Like Modal Interface

**Modal Structure**

```
[Name]                     // Centered at top
                           // Spacing
[Liked Content]            // Photo OR prompt + answer
                           // Spacing
[Text Input Box]           // "Add a message" placeholder
                           // Spacing
[Cancel] [Send Like]       // Left X icon, right Send button
```

**Background**

- Blur effect applied to background content
- Semi-transparent overlay
- Maintains focus on modal content

**Content Display**

- **Name**: Prominent display at modal top
- **Liked Item**:
  - For photos: Full image display
  - For prompts: Prompt + answer displayed clearly
- **Spacing**: Thoughtful vertical spacing between elements

**Input Section**

- **Text Field**: "Add a message" placeholder
- **Character Limit**: Reasonable length for quick messages
- **Keyboard**: Automatically shows when modal opens
- **Placeholder Text**: Encourages personalization

**Button Layout**

- **Cancel Button**: Left side, X icon, subtle styling
- **Send Button**: Right side, prominent styling, confirmation color
- **Equal Spacing**: Buttons positioned at opposite ends
- **Touch Targets**: Appropriate size for mobile interaction

**Modal Positioning**

- Centered vertically and horizontally
- Maximum width constraints for readability
- Responsive height based on content
- Smooth open/close animations

---

## Differentiators from Tinder

1. **Granular Interactions**: Like specific content, not entire profile
2. **Information Display**: Detailed lifestyle/education information visible
3. **Content Variety**: Mix of images, text prompts, and structured data
4. **Communication Method**: Like with message option instead of simple swipe
5. **Content Priority**: Information upfront, not hidden behind interactions
