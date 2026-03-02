# Release Notes — Amazon Product Filter

## v1.2.1

### New
- **Landing Page**: Added a product landing page (`landing/`) for the Chrome Web Store listing — hero, features, sorting showcase, how-it-works, and supported domains.
- **Store Assets**: Added Chrome Web Store graphic assets as ready-to-upload JPEGs/PNG — store icon (128x128 PNG), 3 screenshots (1280x800 JPEG), small promo tile (440x280 JPEG), and marquee promo tile (1400x560 JPEG).

---

## v1.2.0

### New Features
- **Amazon's Choice Filter**: Filter to show only Amazon's Choice products.
- **Limited Time Deal Filter**: Filter to show only products with limited time deals.
- **Magic Score Sorting**: Sort by a combined score (rating × review count), normalized to 0-100.
- **Price Sorting**: Sort by price, high-to-low or low-to-high.
- **Google Sign-In**: Advanced sorting features (Magic Score, Price) require Google sign-in.
- **Buy Me a Coffee**: Donation link added to the popup.

### Bug Fixes
- Fixed orphaned "Add to Cart" buttons remaining visible when products are hidden by filters.
- Removed low-to-high sorting options for rating and review count (not useful).
- Separated Amazon's Choice detection from Best Seller (previously conflated).

### Technical
- Switched Google auth to `launchWebAuthFlow` for compatibility with unpublished extensions.

---

## v1.1.0

### New Features
- **Multi-Dimensional Filtering**: Enable multiple filters simultaneously (e.g. Prime + minimum rating + minimum reviews).
- **Sorting**: Sort visible results by review count or rating, ascending or descending.

### UI Changes
- Filter selection changed from a single dropdown to individual checkboxes — each filter can be toggled independently.
- Sort dropdown added below the filter options.

---

## v1.0.0

### Features
- **Product Filtering**: Automatically hides Amazon search result items that don't meet your criteria.
- **Filter Types**:
  - **Review Count** — Hide products below a minimum number of reviews.
  - **Rating** — Hide products below a minimum star rating.
  - **Best Seller** — Show only products with a Best Seller badge.
  - **Prime Only** — Show only Prime-eligible products.
- **Enable / Disable Toggle**: Quickly turn filtering on or off without losing settings.
- **Persistent Settings**: Filter preferences are saved across sessions using Chrome storage.
- **Auto-Apply**: Saved filters are automatically applied when an Amazon search page loads.

### UI
- Single-tab popup with a clean, minimal layout.
- Beige and black theme throughout.

### Supported Amazon Domains
- amazon.com, amazon.in, amazon.co.uk, amazon.de, amazon.ca
