# Release Notes — Amazon Product Filter

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
