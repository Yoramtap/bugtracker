# PRD: Quiet Navigation (v1)

## 1. Introduction/Overview
Add lightweight navigation to the blog so readers can move faster: keyboard navigation on the blog index and the “Fresh from the build log” cards on the landing page (`j/k` and arrow keys), plus previous/next links at the bottom of each post page. Keep the UI calm and minimal.

## 2. Goals
- Enable fast browsing of posts without a mouse.
- Make it easy to move to adjacent posts while reading.
- Preserve the existing calm, editorial tone.

## 3. User Stories

### US-601: Keyboard Navigation on Index
**Description:** As a reader, I want to move through blog cards with the keyboard so I can scan posts quickly.

**Acceptance Criteria:**
- [ ] `j` or `ArrowDown` moves focus to the next card.
- [ ] `k` or `ArrowUp` moves focus to the previous card.
- [ ] `ArrowRight` moves focus to the next card, `ArrowLeft` to the previous.
- [ ] `Enter` opens the focused card.
- [ ] A subtle visual focus state appears on the active card.
- [ ] Works on the blog index and the “Fresh from the build log” cards on the landing page.
- [ ] Typecheck passes.
- [ ] Verify in browser using agent-browser skill.

### US-602: Previous/Next on Post Page
**Description:** As a reader, I want links to the previous/next post so I can continue reading in order.

**Acceptance Criteria:**
- [ ] Post pages show previous/next links near the bottom.
- [ ] Ordering is based on post date (newest to oldest).
- [ ] Links include post titles and clear labels.
- [ ] Typecheck passes.

## 4. Functional Requirements
1. Keyboard navigation should not interfere with typing in inputs.
2. Index navigation should wrap at the ends (last → first, first → last).
3. Previous/next links should not render if there is no adjacent post.

## 5. Non-Goals (Out of Scope)
- Global keyboard shortcuts outside the blog.
- Animations or sounds for navigation.
- Pagination logic changes.

## 6. Design Considerations
- Focus state should be subtle (outline or glow).
- Links should match the existing card/link styling.

## 7. Technical Considerations
- Use client-side state for focused card index.
- Use `posts` ordering from `web/src/app/blog/posts.ts`.
- Required: verify keyboard behavior in browser using `agent-browser`.

## 8. Success Metrics
- Readers can navigate cards using `j/k` or arrow keys without a mouse.
- Readers can move between posts using previous/next links.

## 9. Open Questions
- Should the focus persist if the user clicks a card? Yes.
