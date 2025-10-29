# WestMatch - University Dating PWA

A Tinder-style dating Progressive Web App exclusively for Westminster International University in Tashkent (WIUT) students.

## What is WestMatch?

WestMatch is a mobile-first PWA that enables WIUT students to:

1. **Create profiles** - Upload photos, write bio, share interests, major, and graduation year
2. **Swipe through students** - See profiles of other WIUT students, swipe right to like, left to pass
3. **Match with mutual likes** - When two students like each other, it's a match!
4. **Chat with matches** - Real-time messaging with your matches
5. **Discover campus connections** - Find students in your classes, major, or year

## Core Use Case

**Problem:** WIUT students want to meet and connect with other students on campus, but traditional dating apps include everyone in Tashkent, making it hard to find fellow students.

**Solution:** A university-exclusive dating app where only verified WIUT students (via `@students.wiut.uz` email) can join.

**Example Flow:**

1. Sarah signs up with `sarah.smith@students.wiut.uz`
2. Verifies her email
3. Creates profile: photos, bio, "Business Management, 2026"
4. Starts swiping through WIUT student profiles
5. Likes John's profile
6. John also liked Sarah → It's a match! 💕
7. They chat in the app and meet at the library

## Key Features

### Authentication & Verification
- Email/password authentication
- **Email domain restriction:** Only `@students.wiut.uz` emails allowed
- Email verification required before accessing the app

### Profile System
- Multiple profile photos (up to 6)
- Bio (500 character limit)
- Major/field of study
- Graduation year
- Interests/hobbies tags
- Age (18-30 range for university students)

### Swipe & Match
- Tinder-style swipe interface
  - Swipe right = Like
  - Swipe left = Pass
  - Tap card for full profile view
- Match algorithm
  - Shows students you haven't swiped on yet
  - Prioritizes students in same year/major (optional)
- Mutual likes create matches
- Match notifications

### Real-Time Chat
- Direct messaging with matches only
- Real-time message delivery
- Read receipts
- Message history
- Unmatch option

### Discovery Filters (Future)
- Filter by graduation year
- Filter by major/faculty
- Age range preferences

## Technical Architecture

### Stack

- **Frontend:** Next.js 16 (React 19, App Router)
- **Styling:** TailwindCSS 4
- **Backend:** Convex (real-time database + serverless functions)
- **Authentication:** Better-Auth (email/password)
- **PWA:** Native app experience with installability
- **Image Storage:** Convex file storage
- **Package Manager:** Bun
- **Linting/Formatting:** Biome

### Why PWA instead of Native App?

1. **No app store approval** - Deploy instantly, update anytime
2. **One codebase** - Works on iOS and Android
3. **Installable** - Users can add to home screen like a native app
4. **Full device access** - Camera, gallery, notifications
5. **Faster development** - Ship MVP in 1-2 weeks
6. **Lower barrier** - No App Store/Play Store account needed

## Project Structure

```
westmatch/
├── src/
│   ├── app/              → Next.js pages & routes
│   ├── components/       → React components
│   │   ├── ui/          → shadcn/ui components
│   │   └── theme-toggler.tsx
│   ├── providers/        → Context providers (theme, auth, Convex)
│   ├── lib/             → Utilities and helpers
│   ├── config/          → App configuration
│   └── types/           → TypeScript types
├── convex/              → Convex backend functions & schema
│   ├── schema.ts        → Database schema
│   ├── users.ts         → User-related functions
│   ├── profiles.ts      → Profile management
│   ├── swipes.ts        → Swipe logic
│   ├── matches.ts       → Match logic
│   └── messages.ts      → Chat functions
└── public/              → Static assets (PWA icons, manifest)
```

## Database Schema (Convex)

### Core Tables

**users**
- `_id` - Convex ID
- `email` - students.wiut.uz email
- `emailVerified` - boolean
- `createdAt` - timestamp

**profiles**
- `_id` - Convex ID
- `userId` - ref to users
- `name` - string
- `age` - number (18-30)
- `bio` - string (max 500 chars)
- `major` - string
- `graduationYear` - number
- `photos` - array of Convex file IDs (max 6)
- `interests` - array of strings
- `isActive` - boolean (profile visibility)

**swipes**
- `_id` - Convex ID
- `swiperId` - ref to users (person who swiped)
- `swipedId` - ref to users (person being swiped on)
- `liked` - boolean (true = right swipe, false = left swipe)
- `timestamp` - timestamp

**matches**
- `_id` - Convex ID
- `user1Id` - ref to users
- `user2Id` - ref to users
- `matchedAt` - timestamp
- `lastMessageAt` - timestamp (for sorting)
- `isActive` - boolean (false if unmatched)

**messages**
- `_id` - Convex ID
- `matchId` - ref to matches
- `senderId` - ref to users
- `text` - string
- `sentAt` - timestamp
- `read` - boolean

## User Flows

### 1. Sign Up & Onboarding
1. Enter email (`@students.wiut.uz` only) and password
2. Verify email via code/link
3. Create profile:
   - Upload 3-6 photos
   - Write bio
   - Select major from dropdown
   - Select graduation year
   - Add interests (optional)
4. Start swiping!

### 2. Swiping
1. See profile card (main photo, name, age, major, year)
2. Swipe right to like, left to pass
3. Tap card to see full profile (all photos, bio, interests)
4. If mutual like → Instant match notification
5. Continue swiping through profiles

### 3. Matching & Chatting
1. Get match notification when mutual like happens
2. Go to matches tab
3. See list of matches sorted by recent activity
4. Tap match to open chat
5. Send messages in real-time
6. Option to unmatch if needed

## Development Roadmap

### Phase 1: MVP (2 weeks)
- [x] Project setup (Next.js, Convex, Biome, PWA basics)
- [x] Dark mode support
- [ ] Convex schema setup
- [ ] Better-Auth integration with email verification
- [ ] Profile creation flow
- [ ] Photo upload (max 6 photos)
- [ ] Swipe UI (basic card stack)
- [ ] Match logic (mutual likes)
- [ ] Basic chat (real-time messaging)

### Phase 2: Polish (1 week)
- [ ] Profile editing
- [ ] Match list with last message preview
- [ ] Proper PWA icons and splash screens
- [ ] Loading states and animations
- [ ] Error handling
- [ ] Deploy to production

### Phase 3: Enhancements (Future)
- [ ] Push notifications for matches and messages
- [ ] Discovery filters (year, major, age)
- [ ] "Undo" last swipe (premium feature?)
- [ ] Profile verification (prevent fake profiles)
- [ ] Report/block users
- [ ] Admin dashboard for moderation
- [ ] Analytics (matches made, active users)

## Technical Decisions

### Why Convex?
- Real-time subscriptions (perfect for chat)
- Built-in file storage (for profile photos)
- No API routes needed (serverless functions)
- Scales automatically
- Great TypeScript support

### Why Better-Auth?
- Full control over auth flow
- Easy email verification
- Works seamlessly with Convex
- Can add social login later if needed

### Why Bun?
- Fastest package manager
- Drop-in replacement for npm/yarn
- Great for rapid development

### Why Biome over ESLint/Prettier?
- Much faster (written in Rust)
- Single tool for linting + formatting
- Better error messages

## Security & Privacy

- Email verification required
- Only verified WIUT students can access
- Users can only message matches (no spam)
- Unmatch and block features
- No public profiles (must be logged in to see anyone)
- Photos stored securely on Convex

## Success Metrics

- **Adoption:** 100+ students signed up in first month
- **Engagement:** 50+ daily active users
- **Matches:** 20+ matches made per day
- **Retention:** 40%+ weekly active users

## Future Considerations

- **Expansion:** Could expand to other universities in Uzbekistan
- **Monetization:** Premium features (unlimited swipes, see who liked you, etc.)
- **Social features:** Group events, study groups
- **Safety features:** Video verification, AI content moderation

---

**Built with ❤️ for WIUT students**
