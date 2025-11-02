# Reconciliation Report - Print-Ready Report Feature

## Overview

The reconciliation report now features a professional, print-ready report with a branded front page and proper page structure. This ensures that what you see on screen is exactly what gets printed or saved as a PDF (WYSIWYG).

## Features

### Professional Front Page
- **FlowShare branding** with logo prominently displayed
- **Executive summary** with key metrics
- **Report metadata** including period, ID, generation date, and status
- **Clean, professional design** suitable for presentations

### Main Report Pages
- **Structured layout** with proper headers and footers
- **Summary statistics** presented in professional cards
- **Partner allocations table** with clear formatting
- **AI analysis section** (when available) on a separate page
- **Page numbers** and branding on each page

### Print Features
- **WYSIWYG printing** - exactly what you see is what you print
- **Proper page breaks** - content is intelligently split across pages
- **A4 page size** with appropriate margins
- **Professional typography** and spacing
- **Print-optimized colors** for better readability

## How to Use

### Viewing the Print-Ready Report

1. Open a reconciliation report from the reconciliation page
2. Click the **"View Print-Ready Report"** button (primary blue button on the left)
3. Preview the professional report with front page and all sections

### Printing or Saving as PDF

1. In the print preview mode, click **"Print / Save as PDF"**
2. Your browser's print dialog will open
3. Choose your options:
   - **Destination**: Select "Save as PDF" to save, or choose a printer to print
   - **Layout**: Portrait is recommended
   - **Pages**: All pages will be included automatically
   - **Margins**: Default margins are already set
4. Click **"Save"** or **"Print"**

### Alternative Download Options

The report modal still provides the original backend-generated options:
- **Download PDF (Backend)** - Server-generated PDF report
- **Download Excel** - CSV export for data analysis

## File Structure

```
report-view-modal/
├── index.tsx                 # Main modal component
├── print-ready-report.tsx    # Print-ready report component
├── print-styles.css          # Print-specific styles
├── components.tsx            # Shared components
└── README.md                 # This file
```

## Technical Details

### Components

**`PrintReadyReport`**
- A React component that renders the professional report
- Uses `forwardRef` for print functionality
- Structured with proper semantic HTML for accessibility
- Includes all necessary data from the reconciliation object

**`print-styles.css`**
- CSS file with print-specific media queries
- Handles page breaks, colors, and layout for printing
- Ensures professional output on both screen and print

### Styling Approach

The report uses CSS print media queries (`@media print`) to:
- Hide UI elements (buttons, dialogs, etc.) when printing
- Optimize colors for print (black and white friendly)
- Set proper page dimensions (A4)
- Handle page breaks intelligently
- Maintain consistent headers and footers

### Browser Compatibility

The print feature works in all modern browsers:
- Chrome/Edge: Full support with excellent print preview
- Firefox: Full support with native print dialog
- Safari: Full support with system print dialog

## Customization

### Changing the Logo

The logo is currently an SVG embedded in `print-ready-report.tsx`. To use a custom logo:

1. Locate the `<svg>` element in the front page section
2. Replace it with an `<img>` tag pointing to your logo file
3. Or update the SVG path to match your logo design

### Adjusting Colors

Colors are defined in `print-styles.css`. Key color variables:
- Primary blue: `#2563eb` (FlowShare brand color)
- Success green: `#16a34a`
- Warning orange: `#ea580c`

### Page Layout

Adjust page margins and sizing in the `@media print` section:
```css
@page {
  size: A4;
  margin: 0; /* Adjust as needed */
}
```

## Benefits

1. **Professional Presentation** - Suitable for executive meetings and stakeholder reports
2. **Consistency** - What you see is exactly what you print
3. **Branding** - FlowShare logo and colors throughout
4. **No Server Dependency** - Print directly from the browser
5. **Fast** - No waiting for server to generate PDF
6. **Flexible** - Easy to customize and extend

## Future Enhancements

Potential improvements:
- Multiple page size options (Letter, Legal)
- Landscape mode for wide tables
- Chart/graph visualizations
- Custom branding per tenant
- Report templates
