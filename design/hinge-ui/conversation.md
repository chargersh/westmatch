# Conversation Thread

## Header

- Left: Chevron `<` back icon
- Center: Person's name
- Right: Three dots menu (functionality TBD)

## Tabs

- Chat
- Profile

---

## Chat Content

### Conversation Start (Like Notification)

When a conversation begins from a like:

1. **Card displayed:**
   - The liked content (prompt or photo) in small size
   - User's answer/response to that prompt shown

2. **Message stamped on top (overlaid slightly):**
   - If liked a prompt: "Liked your answer"
   - If liked a photo: "Liked your photo"
   - Or: Custom text the user typed in the like modal input

### Message Bubbles

- Standard chat bubbles
- Width: ~80% of screen width
- My messages: justify-end (right aligned)
- Their messages: justify-start (left aligned)

### Their Messages

- Profile photo as avatar displayed at the top with their name
- Similar to Telegram style (image + name at top)
- Then message bubbles below

### My Messages

- Standard bubbles (right aligned)
- Under my latest message: Read receipt indicator
  - Single check icon: Message sent
  - Double check icon: Message read (recipient opened chat)
  - Double check appears instantly if recipient is online

### Message Interactions

- Double tap to like a message (heart reaction)

---

## Bottom Input

- Text input field
- Send button
- Text-only messaging (no image uploads)

---

## Notes

- No file/image uploads in chat
- Text to text only
- Read receipts based on recipient opening the chat or being online
