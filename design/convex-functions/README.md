# Convex Functions Architecture

## Profile Functions

### Profile Mutations

- Create profile (initial setup)
- Update profile basics (gender, interestedIn, birthDate, year, major)
- Update profile preferences (preferredYears, drinking, smoking)
- Update profile bio
- Mark profile as complete
- Delete profile

### Profile Queries

- Get profile by userId
- Get my own profile
- Check if profile exists
- Get profile completion status

## Profile Photos Functions

### Profile Photos Mutations

- Upload profile photo
- Reorder profile photos
- Delete profile photo (soft delete)
- Update photo order index

### Profile Photos Queries

- Get profile photos by profileId
- Get profile photo by photoId
- Get all photos for a user

## Profile Prompts Functions

### Profile Prompts Mutations

- Add prompt answer
- Update prompt answer
- Delete prompt answer (soft delete)
- Reorder prompts

### Profile Prompts Queries

- Get profile prompts by profileId
- Get prompt by promptId
- Get all prompts for a user

## Discovery & Matching Functions

### Discovery/Matching Queries

- Get recommended profiles (based on preferences)
- Get next profile to view
- Get profiles I've already liked/passed
- Check if can interact with profile

### Like Mutations

- Create like (with content reference)
- Unlike/removelike

### Like Queries

- Get likes sent by user
- Get likes received by user
- Check if specific like exists
- Get likes by content type

### Pass Mutations

- Create pass
- Remove pass (if needed)

### Pass Queries

- Get passes sent by user
- Check if user passed on specific profile

## Match Functions

### Match Mutations

- (Usually created automatically via likes)
- Update match status (active/inactive)
- Update match last message details
- Unmatch/delete match

### Match Queries

- Get all matches for user
- Get match by matchId
- Get match details with other user's profile
- Get matches with unread messages

## Messaging Functions

### Message Mutations

- Send message
- Mark messages as read
- Delete message (if needed)

### Message Queries

- Get messages by matchId (with pagination)
- Get unread messages count
- Get last message for each match
- Search messages within match

## User Discovery Functions

### User Discovery Queries

- Get users matching preferences
- Exclude already interacted users
- Paginate through suggestions
- Filter by year/gender/major

## Admin & Utility Functions

### Utility Queries

- Clean up deleted photos/prompts
- Get user statistics
- Report inappropriate content
- Block/unblock user

## Real-time Functions

### Subscriptions

- Subscribe to new matches
- Subscribe to new messages
- Subscribe to profile updates
