#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Snarbles Deployment Readiness Check\n');

let allChecks = true;

// Check 1: Environment variables
console.log('1. Environment Variables:');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabase = envContent.includes('NEXT_PUBLIC_SUPABASE_URL') && 
                     !envContent.includes('placeholder');
  const hasSolana = envContent.includes('NEXT_PUBLIC_SOLANA_NETWORK');
  
  console.log(`   ✅ .env.local exists`);
  console.log(`   ${hasSupabase ? '✅' : '❌'} Supabase configured`);
  console.log(`   ${hasSolana ? '✅' : '❌'} Solana configured`);
  
  if (!hasSupabase || !hasSolana) allChecks = false;
} else {
  console.log('   ❌ .env.local missing');
  allChecks = false;
}

// Check 2: Package.json dependencies
console.log('\n2. Dependencies:');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const hasNext = packageJson.dependencies?.next;
  const hasReact = packageJson.dependencies?.react;
  const hasAlgosdk = packageJson.dependencies?.algosdk;
  const hasSolana = packageJson.dependencies?.['@solana/web3.js'];
  
  console.log(`   ✅ package.json exists`);
  console.log(`   ${hasNext ? '✅' : '❌'} Next.js: ${hasNext || 'missing'}`);
  console.log(`   ${hasReact ? '✅' : '❌'} React: ${hasReact || 'missing'}`);
  console.log(`   ${hasAlgosdk ? '✅' : '❌'} Algorand SDK: ${hasAlgosdk || 'missing'}`);
  console.log(`   ${hasSolana ? '✅' : '❌'} Solana Web3: ${hasSolana || 'missing'}`);
  
  if (!hasNext || !hasReact || !hasAlgosdk || !hasSolana) allChecks = false;
} else {
  console.log('   ❌ package.json missing');
  allChecks = false;
}

// Check 3: Build files
console.log('\n3. Build Configuration:');
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.ts');
const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');

console.log(`   ${fs.existsSync(nextConfigPath) ? '✅' : '❌'} next.config.js`);
console.log(`   ${fs.existsSync(tailwindConfigPath) ? '✅' : '❌'} tailwind.config.ts`);
console.log(`   ${fs.existsSync(tsConfigPath) ? '✅' : '❌'} tsconfig.json`);

if (!fs.existsSync(nextConfigPath) || !fs.existsSync(tailwindConfigPath) || !fs.existsSync(tsConfigPath)) {
  allChecks = false;
}

// Check 4: Essential pages
console.log('\n4. Essential Pages:');
const pages = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/create/page.tsx',
  'app/dashboard/page.tsx',
  'app/tokenomics/page.tsx',
  'app/verify/page.tsx'
];

pages.forEach(page => {
  const exists = fs.existsSync(path.join(process.cwd(), page));
  console.log(`   ${exists ? '✅' : '❌'} ${page}`);
  if (!exists) allChecks = false;
});

// Check 5: Essential components
console.log('\n5. Essential Components:');
const components = [
  'components/layout/Navbar.tsx',
  'components/layout/Footer.tsx',
  'components/TokenForm.tsx',
  'components/TokenPreview.tsx'
];

components.forEach(component => {
  const exists = fs.existsSync(path.join(process.cwd(), component));
  console.log(`   ${exists ? '✅' : '❌'} ${component}`);
  if (!exists) allChecks = false;
});

// Check 6: Static assets
console.log('\n6. Static Assets:');
const assets = [
  'public/manifest.json',
  'public/robots.txt',
  'public/sitemap.xml',
  'public/pSsNHPck_400x400.jpg'
];

assets.forEach(asset => {
  const exists = fs.existsSync(path.join(process.cwd(), asset));
  console.log(`   ${exists ? '✅' : '❌'} ${asset}`);
  if (!exists) allChecks = false;
});

// Final result
console.log('\n🏁 Deployment Readiness Result:');
if (allChecks) {
  console.log('✅ ALL CHECKS PASSED - Ready for deployment!');
  console.log('\n🚀 Recommended next steps:');
  console.log('   1. Run: npm run build (to test production build)');
  console.log('   2. Run: npm run analyze (to check bundle size)');
  console.log('   3. Deploy to Vercel: vercel --prod');
  console.log('   4. Or deploy to Netlify: netlify deploy --prod');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED - Please fix issues before deployment');
  console.log('\n📖 Check DEPLOYMENT.md for detailed setup instructions');
  process.exit(1);
}