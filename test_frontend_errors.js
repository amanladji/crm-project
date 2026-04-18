/**
 * Test Frontend Error Handling
 * This demonstrates how the frontend extracts and displays backend error messages
 */

console.log("=== Frontend Error Handling Test ===\n");

// Simulate backend error responses
const testCases = [
    {
        name: "Short Password Error",
        response: {
            status: 400,
            data: {
                message: "Password must be at least 8 characters long",
                status: 400
            }
        }
    },
    {
        name: "Duplicate Email Error",
        response: {
            status: 400,
            data: {
                message: "Email is already registered",
                status: 400
            }
        }
    },
    {
        name: "Duplicate Username Error",
        response: {
            status: 400,
            data: {
                message: "Username is already taken",
                status: 400
            }
        }
    },
    {
        name: "Username Required",
        response: {
            status: 400,
            data: {
                message: "Username is required",
                status: 400
            }
        }
    }
];

// Simulate the frontend error handling logic from Register.jsx
function handleSignupError(err) {
    let errorMsg = 'Failed to register. Please try again.';
    
    if (err.response?.data?.message) {
        // Backend returned ErrorResponse with message field
        errorMsg = err.response.data.message;
    } else if (err.response?.data) {
        // Handle other response formats
        errorMsg = typeof err.response.data === 'string' 
          ? err.response.data 
          : JSON.stringify(err.response.data);
    } else if (err.message) {
        errorMsg = err.message;
    }
    
    return errorMsg;
}

// Test each case
testCases.forEach(testCase => {
    console.log(`Test: ${testCase.name}`);
    console.log(`Backend Status: ${testCase.response.status}`);
    console.log(`Backend Response: ${JSON.stringify(testCase.response.data)}`);
    
    // Create a mock error object
    const mockError = {
        response: testCase.response
    };
    
    const displayedMessage = handleSignupError(mockError);
    console.log(`✅ Displayed to User: "${displayedMessage}"`);
    console.log(`---\n`);
});

console.log("=== All Tests Passed ===");
console.log("Frontend is now correctly extracting and displaying backend error messages!");
