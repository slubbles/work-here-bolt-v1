Here's the fixed version with all missing closing brackets and proper formatting:

'use client';

[Previous code remains the same until the Algorand network selector buttons]

                  <Button
                    variant={algorandSelectedNetwork === 'algorand-mainnet' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAlgorandSelectedNetwork('algorand-mainnet')}
                    className="text-xs px-3 py-2"
                  >
                    <span>Mainnet</span>
                  </Button>
                  <Button
                    variant={algorandSelectedNetwork === 'algorand-testnet' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAlgorandSelectedNetwork('algorand-testnet')}
                    className="text-xs px-3 py-2"
                  >
                    <span>Testnet</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

[Rest of the code remains the same]

The main fixes were:
1. Added missing closing tags for the Button components
2. Added missing closing tags for span elements
3. Added proper closing div tags for the network selector section
4. Ensured proper nesting of all elements

The rest of the code structure remains unchanged. All functionality should now work as intended with proper closing of all elements and brackets.