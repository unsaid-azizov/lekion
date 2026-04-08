# Lekion Map - Frontend Architecture

## Pages (Next.js App Router)

```
app/[locale]/
├── layout.tsx                         # Root: providers, navbar, footer
├── page.tsx                           # Home = map view (main page)
├── auth/
│   ├── login/page.tsx
│   ├── register/[referralCode]/page.tsx
│   └── verify-email/page.tsx
├── profile/
│   ├── page.tsx                       # Own profile (view/edit)
│   └── [id]/page.tsx                  # Public profile
├── businesses/
│   ├── new/page.tsx                   # Create business
│   ├── [id]/page.tsx                  # Business detail
│   └── [id]/edit/page.tsx             # Edit business
├── search/page.tsx                    # Search results (list view)
├── referrals/page.tsx                 # Referral info + invite
├── admin/
│   ├── page.tsx                       # Dashboard
│   ├── users/page.tsx                 # User management
│   └── pending/page.tsx               # Approval queue
└── pending-approval/page.tsx          # Shown while awaiting approval
```

## Component Structure

### Layout
- `Navbar` — logo, search input, user menu, locale switcher
- `Footer` — links, copyright
- `Sidebar` — search filters (slides in on mobile)

### Map
- `MapContainer` — loads Yandex Maps JS API, initializes map instance
- `MapPinLayer` — renders pins, handles click events
- `MapClusterManager` — groups nearby pins at low zoom
- `PinPopup` — balloon card on pin click (name, photo, "View details" link)
- `MapControls` — zoom, geolocation, layer toggle
- `MapSearchOverlay` — floating search panel over the map

### Search
- `SearchBar` — text input with 300ms debounce
- `FilterPanel` — collapsible filters: category, city, profession, rating, tags
- `SearchResultsList` — result cards list
- `SearchResultCard` — individual result (person or business)
- `TabSwitch` — People / Businesses toggle

### Profile
- `UserProfileCard` — display user info, photo, contacts
- `UserProfileForm` — edit form
- `BusinessList` — businesses owned by user (on profile page)
- `PhotoUploader` — drag-and-drop with preview and crop

### Business
- `BusinessCard` — summary card for lists
- `BusinessDetail` — full business page
- `BusinessForm` — create/edit form with all fields
- `WorkingHoursEditor` — day-by-day hours input
- `PhotoGallery` — lightbox gallery
- `CategorySelect` — dropdown with predefined categories
- `TagInput` — free-form tags with autocomplete from existing

### Reviews
- `ReviewList` — paginated reviews
- `ReviewCard` — rating stars, comment, owner reply
- `ReviewForm` — stars + text area
- `OwnerReplyForm` — inline reply for business owner
- `StarRating` — reusable star display/input

### Auth
- `LoginForm` — email/password + Google OAuth button
- `RegisterForm` — registration fields (requires valid referral code)
- `GoogleAuthButton` — initiates OAuth flow
- `PendingApprovalNotice` — waiting message

### Admin
- `ApprovalQueue` — pending users with approve/reject actions
- `UserManagementTable` — sortable, filterable user table
- `AdminStatsCards` — summary statistics

### Shared (ShadCN)
`Button`, `Input`, `Select`, `Dialog`, `Sheet`, `Card`, `Avatar`, `Badge`, `Tabs`, `Skeleton`, `Toast`, `DropdownMenu`, `Pagination`

## i18n

Library: `next-intl`

```
messages/
├── ru.json    # Default, complete
└── en.json    # Same keys
```

**Adding a new language:**
1. Add locale to `locales` array in `i18n.ts` and `middleware.ts`
2. Create `messages/{locale}.json` with same key structure
3. Add DB columns for translated content (category names etc.)

All URLs include locale prefix: `/ru/...`, `/en/...`

## Map Integration

1. `MapContainer` loads Yandex Maps JS API via script tag
2. On load + every `boundschange`, frontend calls `GET /api/v1/map/pins?bounds=...&type=...`
3. Creates `ymaps.Placemark` objects with different icons for people vs businesses
4. Pin click shows `ymaps.Balloon` with summary + link
5. At low zoom: server-side clustering via `/map/clusters`; at high zoom: client-side `ymaps.Clusterer`

**Address input:** Users manually type address and click on a mini-map to set coordinates (no autocomplete API).

## State Management

- Server state: `@tanstack/react-query` for API data fetching and caching
- Auth state: React context + httpOnly refresh cookie
- Map state: React refs (Yandex Maps instance is imperative)
- URL state: Next.js searchParams for search filters (shareable URLs)
