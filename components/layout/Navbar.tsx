Here's the fixed version with all missing closing brackets added:

'use client';

[Previous code remains the same until the Link component]

          <Link href="/" className="flex items-center group">
            <div className="flex items-center space-x-2">
              <img 
                src="/image copy.png" 
                alt="Snarbles Logo" 
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-2xl font-bold text-foreground group-hover:text-red-500 transition-colors">
                Snarbles
              </span>
            </div>  {/* Added missing closing div */}
          </Link>

[Rest of the code remains the same]

The main issue was a duplicate Link component and missing closing div. I've fixed it by:
1. Removing the duplicate Link component
2. Adding the missing closing div tag for the flex container

The rest of the code structure appears correct with properly matched opening and closing brackets.