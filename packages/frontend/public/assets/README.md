# Context Section Assets

This folder contains images for the editorial context section on the landing page.

## Folder Structure

```
assets/
├── news/           # News headline screenshots
│   ├── headline-1.jpg
│   ├── headline-2.jpg
│   └── ...
├── construction/   # Construction site imagery
│   ├── site-1.jpg
│   ├── site-2.jpg
│   └── ...
└── README.md
```

## Adding Images

### News Headlines
- Place in `news/` folder
- Naming: `headline-1.jpg`, `headline-2.jpg`, etc.
- Content: Screenshots of UK housing/BSR/regulatory news
- Recommended size: 800x480px minimum
- Will be displayed at 320x192px (object-fit: cover)

### Construction Images
- Place in `construction/` folder
- Naming: `site-1.jpg`, `site-2.jpg`, etc.
- Content: Professional construction site photos
- Recommended size: 640x480px minimum
- Will be displayed at 256x192px (object-fit: cover)

## Updating the Component

After adding images, update the arrays in:
`src/components/ContextSection.tsx`

```typescript
const NEWS_IMAGES = [
  { src: '/assets/news/headline-1.jpg', alt: 'Description here' },
  // Add more entries...
];

const CONSTRUCTION_IMAGES = [
  { src: '/assets/construction/site-1.jpg', alt: 'Description here' },
  // Add more entries...
];
```

## Image Guidelines

- **Headlines**: Keep them readable. No heavy cropping that cuts off text.
- **Construction**: Neutral, professional. Urban/residential development preferred.
- **Format**: JPG recommended for photos. PNG for screenshots with sharp text.
- **Aspect ratio**: Various ratios work - images are cropped to fit containers.
- **File size**: Optimize for web (< 500KB per image recommended).
