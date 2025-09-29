# Subject Selection Page

## Overview
The Subject Selection page allows students to choose their desired subject for practice sessions. It provides a clean, card-based interface displaying available subjects with visual indicators for recently used subjects and smooth loading states.

## Key Features

### 1. **Dynamic Subject Loading**
- **API Integration**: Fetches subjects from backend
- **Loading State**: Animated spinner with message
- **Error Handling**: Clear error messages with recovery options
- **Fallback Support**: Works with mock data when offline

### 2. **Smart Selection Memory**
- **Last Selected Tracking**: Remembers previously selected subject
- **Visual Indicator**: "最近使用" badge on last used subject
- **LocalStorage Persistence**: Survives page refreshes
- **Quick Resume**: Easy continuation of previous study session

### 3. **Visual Design**
- **Card Layout**: Each subject as an interactive card
- **Icon System**: Subject-specific icons (Scroll for history, DNA for biology)
- **Hover Effects**: Scale, translate, and shadow animations
- **Gradient Backgrounds**: Subtle color transitions
- **Responsive Grid**: Adapts to screen size (1-3 columns)

### 4. **User Experience**
- **Clear Navigation**: Back to home button
- **Visual Feedback**: Hover and focus states
- **Accessibility**: Keyboard navigation support
- **Loading Feedback**: Clear loading indicators

## User Interface Components

### Header Section
1. **Back Button**
   - Arrow icon with text
   - Glassmorphic design
   - Hover animation (translate)

2. **Page Title**
   - Large gradient text
   - "选择学科" heading
   - Descriptive subtitle

### Subject Grid
1. **Subject Cards**
   - Icon in colored background
   - Subject name (large, bold)
   - Description text
   - Question count display
   - Interactive hover effects

2. **Card States**
   - **Normal**: Default appearance
   - **Hover**: Scale up, shadow increase
   - **Selected**: Blue border with ring
   - **Recently Used**: Badge indicator

### Loading State
- Centered spinner animation
- "加载学科中..." message
- Glassmorphic container
- Smooth fade-in animation

### Error State
- Warning icon
- Error message display
- "返回首页" button
- Clear recovery path

## Technical Implementation

### Props Interface
```typescript
interface SubjectSelectionProps {
  onSelectSubject: (subject: Subject) => void;
  onBack: () => void;
  currentSubject?: Subject | null;
}
```

### Data Management
- **API Hook**: `useSubjects()` for data fetching
- **Loading State**: Boolean flag for UI feedback
- **Error Handling**: Error message display
- **Cache Strategy**: LocalStorage for last selection

### Subject Data Structure
```typescript
interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  questionCount?: number;
}
```

### Icon Mapping
- Dynamic icon component resolution
- Fallback to emoji icons
- Lucide React icon integration

## User Experience Flow

### First-Time Selection
1. User lands on subject selection
2. Views all available subjects
3. Reads descriptions
4. Clicks desired subject
5. Proceeds to knowledge point selection

### Returning User Flow
1. Page loads with last selection highlighted
2. "最近使用" badge shows previous choice
3. Can continue with same subject
4. Or select different subject

### Error Recovery Flow
1. API call fails
2. Error message displays
3. User clicks "返回首页"
4. Returns to home page
5. Can retry or use offline mode

## Visual Design Details

### Color Scheme
- **Background**: Gradient from slate-50 to indigo-100
- **Cards**: White with transparency
- **History**: Amber gradient (bg-gradient-to-br from-amber-500 to-orange-600)
- **Biology**: Green gradient (bg-gradient-to-br from-green-500 to-emerald-600)
- **Hover**: Blue-50 overlay

### Typography
- **Title**: 4xl-5xl, bold, gradient text
- **Subtitle**: xl, gray-600
- **Card Title**: 2xl, bold, gray-900
- **Description**: base, gray-600
- **Count**: sm, gray-500

### Animations
1. **Card Hover**
   - scale(1.05)
   - translateY(-8px)
   - Shadow enhancement
   - Background gradient fade-in

2. **Icon Hover**
   - scale(1.1)
   - rotate(3deg)
   - Smooth transition

3. **Loading Spinner**
   - Continuous rotation
   - Border animation

### Responsive Design
- **Mobile**: Single column
- **Tablet**: 2 columns
- **Desktop**: 2-3 columns
- **Max Width**: 4xl container

## Accessibility Features

### Keyboard Navigation
- Tab through all cards
- Enter/Space to select
- Escape to go back
- Clear focus indicators

### Screen Reader Support
- Semantic button elements
- Descriptive labels
- Loading state announcements
- Error message announcements

### Visual Accessibility
- High contrast text
- Large touch targets (full card clickable)
- Clear hover states
- Color not sole indicator

## State Management

### Local State
- None (data from hooks)

### Persistent State
- `lastSelectedSubject` in localStorage
- Survives page refreshes
- Cross-session memory

### API State
- Managed by `useSubjects` hook
- Loading/error/data states
- Automatic retry logic

## Best Practices

### Performance
- Lazy loading of icons
- Optimized re-renders
- LocalStorage caching
- Minimal DOM updates

### User Experience
- Clear visual hierarchy
- Immediate feedback
- Progressive disclosure
- Error recovery paths

### Code Quality
- Type-safe props
- Error boundaries
- Clean separation of concerns
- Reusable components

## Configuration

### Subject Configuration
Subjects are fetched from backend API:
- Dynamic subject list
- Configurable icons and colors
- Question count from database

### Customization Points
- Icon mapping object
- Color schemes per subject
- Grid layout breakpoints
- Animation timings

## Integration Points

### API Endpoints
- `GET /v1/subjects`: Fetch all subjects
- Returns array of Subject objects

### Navigation
- `onSelectSubject`: Proceeds to knowledge selection
- `onBack`: Returns to home page

### Data Flow
1. Fetch subjects from API
2. Display in grid layout
3. User selects subject
4. Pass selection to parent
5. Navigate to next screen

## Error Handling

### API Failures
- Clear error message
- Return home option
- Fallback to cached data

### Empty State
- "No subjects available" message
- Contact support option
- Retry button

### Network Issues
- Offline mode detection
- Use cached subjects
- Sync when online

## Future Enhancements

### Planned Features
- Subject search/filter
- Favorite subjects
- Subject statistics
- Progress indicators
- Custom subject ordering
- Subject recommendations

### UI Improvements
- Animated transitions between states
- Skeleton loading screens
- Pull-to-refresh on mobile
- Subject preview on hover
- Quick actions menu

### Personalization
- Recommended subjects based on history
- Custom subject colors
- Pinned favorites
- Recent activity display
- Learning path suggestions

## Common Issues & Solutions

### Issue: Subjects not loading
**Solution**: Check API endpoint, verify backend is running

### Issue: Last selection not remembered
**Solution**: Verify localStorage is enabled in browser

### Issue: Icons not displaying
**Solution**: Ensure icon components are properly imported

## Implementation Verification ✅

### Current Implementation
- ✅ Dynamic subject loading from API
- ✅ Loading and error states
- ✅ Last selected subject tracking
- ✅ Visual feedback and animations
- ✅ Responsive grid layout
- ✅ Keyboard navigation
- ✅ LocalStorage persistence

### Design Match
The implementation perfectly matches the design with:
- Clean card-based layout
- Smooth animations
- Clear visual hierarchy
- Intuitive navigation
- Proper error handling
- Accessibility support