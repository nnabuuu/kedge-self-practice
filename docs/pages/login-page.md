# Login Page

## Overview
The Login Page is the entry point to the Kedge Self-Practice Learning Platform. It provides secure authentication for students, teachers, and administrators while offering a smooth transition between backend-connected and demo modes.

## Key Features

### 1. **Multi-Role Authentication**
- **Student Login**: Access to practice sessions and learning materials
- **Teacher Login**: Access to dashboard and content management
- **Admin Login**: Full system access (displayed as teacher in UI)

### 2. **Flexible Authentication Modes**
- **Backend Authentication**: Primary mode using JWT tokens
- **Demo Mode Fallback**: Automatic fallback when backend is unavailable
- **Seamless Transition**: Users experience consistent login regardless of backend status

### 3. **Security Features**
- **Password Visibility Toggle**: Eye icon to show/hide password
- **JWT Token Management**: Secure token storage in localStorage
- **Error Handling**: Clear feedback for authentication failures

### 4. **Demo Accounts**
Configurable visibility based on system settings:
- **Student**: `student@example.com` (password: 11223344)
- **Teacher**: `teacher@example.com` (password: 11223344)
- **Admin**: `admin@example.com` (password: 11223344)

## User Interface

### Visual Design
- **Gradient Background**: Blue to purple gradient for visual appeal
- **Card Layout**: Clean white card with shadow for login form
- **Icon Integration**: Role-specific icons (GraduationCap, Brain, Sparkles)
- **Responsive Design**: Mobile-friendly layout

### Form Elements
1. **Email Input**
   - Email validation
   - User icon
   - Placeholder text

2. **Password Input**
   - Password type toggle
   - Lock icon
   - Show/hide functionality

3. **Submit Button**
   - Loading state with spinner
   - Disabled during submission
   - "登录" text

4. **Demo Account Buttons**
   - Quick login for testing
   - Role-specific colors
   - Auto-fill credentials

## Technical Implementation

### State Management
```typescript
- formData: { email: string, password: string }
- showPassword: boolean
- isLoading: boolean
- error: string
- showDemoAccounts: boolean
```

### Authentication Flow
1. **Form Submission**
   - Validate inputs
   - Call authService.login()
   - Handle response

2. **Success Handling**
   - Store JWT token
   - Store user data
   - Role mapping (admin → teacher for UI)
   - Trigger onLogin callback

3. **Error Handling**
   - Display error messages
   - Fallback to demo accounts
   - Clear error on retry

### Backend Integration
- **Endpoint**: `/auth/login`
- **Method**: POST
- **Payload**: `{ email, password }`
- **Response**: `{ token, user: { id, name, email, role } }`

### Configuration
- **Demo Account Visibility**: Controlled by systemConfigService
- **Auto-Detection**: Checks backend availability
- **Fallback Logic**: Seamless demo mode when offline

## User Experience Flow

### Student Login Flow
1. Enter credentials
2. Click login button
3. Redirected to HomePage
4. Can select subjects for practice

### Teacher/Admin Login Flow
1. Enter credentials
2. Click login button
3. Redirected to HomePage with teacher view
4. Access to TeacherDashboard

### Demo Mode Flow
1. Click demo account button
2. Credentials auto-filled
3. Automatic login
4. Full feature access in demo mode

## Error States

### Common Errors
- **Invalid Credentials**: "邮箱或密码错误"
- **Network Error**: "网络连接失败，请检查网络"
- **Server Error**: "服务器错误，请稍后再试"

### Error Recovery
- Clear error message on new attempt
- Automatic fallback to demo mode
- Retry button functionality

## Security Considerations

### Password Handling
- Never logged or stored in plain text
- Password visibility toggle for user convenience
- Secure transmission over HTTPS

### Token Management
- JWT stored in localStorage
- Token included in API headers
- Token expiration handling

### Demo Mode Security
- Demo accounts only for testing
- No real data access in demo mode
- Clear indication of demo status

## Accessibility

### Keyboard Navigation
- Tab order: Email → Password → Show/Hide → Login → Demo buttons
- Enter key submits form
- Escape key clears errors

### Screen Reader Support
- Proper ARIA labels
- Form validation announcements
- Loading state announcements

### Visual Accessibility
- High contrast text
- Clear focus indicators
- Sufficient touch targets

## Best Practices

### For Users
1. Use real credentials for actual practice
2. Use demo accounts for testing only
3. Keep passwords secure
4. Log out when done

### For Developers
1. Never expose real credentials
2. Implement proper error handling
3. Test both online and offline modes
4. Maintain demo account functionality

## Configuration

### Environment Variables
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_SHOW_DEMO_ACCOUNTS`: Show/hide demo buttons

### System Config
- `shouldShowDemoAccounts()`: Dynamic demo visibility
- Configurable via backend settings

## Future Enhancements

### Planned Features
- Social login (WeChat, QQ)
- Remember me functionality
- Password reset flow
- Two-factor authentication
- Biometric login (mobile)

### UI Improvements
- Animation transitions
- Loading skeleton screens
- Better error visualizations
- Onboarding tour for new users