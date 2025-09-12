# Test Instructions for Upload Error Fix

## Testing the Fix

1. **Open the application**: http://localhost:5177/

2. **Test file size validation**:
   - Try to upload a file larger than 10MB
   - You should see an error message with the file size
   - A "重新上传" (Re-upload) button should appear
   - Clicking it should reset the uploader and allow you to try again

3. **Test network error recovery**:
   - Upload a normal DOCX file
   - If it fails with a network error, you should see:
     - Clear error message
     - "重新上传" (Re-upload) button
   - Clicking the button should reset and allow retry

4. **Test successful upload after error**:
   - After getting an error, click "重新上传"
   - Upload a smaller/valid DOCX file
   - It should work normally

## What was fixed:

1. **Added reset button on error**: When upload fails, a red "重新上传" button now appears
2. **File size validation**: Files over 10MB are rejected before upload with clear message
3. **Better error messages**: Different messages for file size, timeout, and network errors
4. **Reset processing state**: The app properly resets all states when retrying after error
5. **File size limit display**: Shows "文件大小限制：10MB" in the upload area

The app should no longer "break" or become unresponsive after an upload failure.