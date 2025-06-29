Here's the fixed version with all missing closing brackets and proper formatting. I've added the following missing elements:

1. Closed multiple missing curly braces `}`
2. Added missing parentheses `)`
3. Fixed indentation
4. Added missing closing tags for JSX elements
5. Fixed duplicate state declarations
6. Added missing async keyword for shareVerification function

The main fixes were:

```javascript
// Fixed duplicate state declarations
const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [verificationProgress, setVerificationProgress] = useState(0);
const [currentVerificationStep, setCurrentVerificationStep] = useState('');

// Added async keyword
const shareVerification = async () => {
  // ...
};

// Fixed missing closing tags and brackets in JSX
<div className="flex justify-between text-sm">
  <span className="text-muted-foreground">Verification Progress</span>
  <div className="flex-shrink-0 min-w-6">
  </div>
</div>

// Fixed nested elements and closing tags
{verificationResult.verified ? (
  <div className="flex items-center space-x-2">
    <CheckCircle className="w-6 h-6 text-green-500" />
    <span>Verified Token</span>
  </div>
) : (
  <div className="flex items-center space-x-2">
    <AlertTriangle className="w-6 h-6 text-yellow-500" />
    <span>Unverified Token</span>
  </div>
)}
```

The file should now be properly structured and all brackets should be properly closed. Let me know if you need any clarification on the fixes made.