// Supabase Configuration
const supabaseUrl = 'https://zlvrbfezgcrsfagprley.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsdnJiZmV6Z2Nyc2ZhZ3BybGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5Njk1NzIsImV4cCI6MjA1OTU0NTU3Mn0.1DGwFR4bOT_PS3CX6nwhdK9hQjO5aXIYKF7l2IpDnJM';

// Initialize Supabase client
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Function to generate a random token
function generateToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Function to verify if token is valid
async function verifyToken(token) {
  const { data, error } = await supabase
    .from('users')
    .select('email, token_expiry')
    .eq('token', token)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if token has expired
  if (data.token_expiry && new Date(data.token_expiry) < new Date()) {
    return null;
  }

  return data.email;
}

// Function to create or update a user
async function upsertUser(email) {
  const token = generateToken();
  
  // Set expiration date to 7 days from now
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (existingUser) {
    // Update existing user's token
    const { data, error } = await supabase
      .from('users')
      .update({
        token: token,
        token_expiry: expiryDate.toISOString(),
        last_login: new Date().toISOString()
      })
      .eq('email', email)
      .select();
    
    if (error) {
      console.error('Error updating user:', error);
      return null;
    }
    
    return { token, isNewUser: false };
  } else {
    // Create a new user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: email,
          token: token,
          token_expiry: expiryDate.toISOString(),
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          balance_usd: 0,
          completed_surveys: 0
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating user:', error);
      return null;
    }
    
    return { token, isNewUser: true };
  }
}

// Function to get user balance
async function getUserBalance(email) {
  const { data, error } = await supabase
    .from('users')
    .select('balance_usd')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error('Error getting balance:', error);
    return { balanceUSD: "0.00" };
  }
  
  return {
    balanceUSD: data.balance_usd.toFixed(2)
  };
}

// Function to update user balance
async function updateUserBalance(email, bonusUSD) {
  // Get current balance
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('balance_usd')
    .eq('email', email)
    .single();
  
  if (userError) {
    console.error('Error getting user:', userError);
    return null;
  }
  
  // Calculate new balance
  const newBalanceUSD = userData.balance_usd + bonusUSD;
  
  // Update balance
  const { data, error } = await supabase
    .from('users')
    .update({
      balance_usd: newBalanceUSD
    })
    .eq('email', email)
    .select();
  
  if (error) {
    console.error('Error updating balance:', error);
    return null;
  }
  
  return {
    balanceUSD: newBalanceUSD.toFixed(2)
  };
}

// Function to increment completed surveys counter
async function incrementCompletedSurveys(email) {
  // Get current counter
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('completed_surveys')
    .eq('email', email)
    .single();
  
  if (userError) {
    console.error('Error getting user:', userError);
    return 0;
  }
  
  const newCount = (userData.completed_surveys || 0) + 1;
  
  // Update counter
  const { data, error } = await supabase
    .from('users')
    .update({
      completed_surveys: newCount
    })
    .eq('email', email)
    .select();
  
  if (error) {
    console.error('Error updating counter:', error);
    return 0;
  }
  
  return newCount;
}

// Function to reset completed surveys counter
async function resetCompletedSurveys(email) {
  const { data, error } = await supabase
    .from('users')
    .update({
      completed_surveys: 0
    })
    .eq('email', email)
    .select();
  
  if (error) {
    console.error('Error resetting counter:', error);
    return false;
  }
  
  return true;
}

// Function to get completed surveys counter
async function getCompletedSurveys(email) {
  const { data, error } = await supabase
    .from('users')
    .select('completed_surveys')
    .eq('email', email)
    .single();
  
  if (error) {
    console.error('Error getting counter:', error);
    return 0;
  }
  
  return data.completed_surveys || 0;
}

// List of available products for evaluation
const availableProducts = [
  {
    id: 1,
    name: "Premium Smartphone",
    category: "Electronics",
    image: "./assets/Smartphone.webp",
    bonus: 1.67
  },
  {
    id: 2,
    name: "Ultralight Laptop",
    category: "Electronics",
    image: "./assets/laptop.webp",
    bonus: 1.67
  },
  {
    id: 3,
    name: "Bluetooth Headphones",
    category: "Accessories",
    image: "./assets/headphones.jpg",
    bonus: 1.67
  },
  {
    id: 4,
    name: "Fitness Smartwatch",
    category: "Wearables",
    image: "./assets/smarthwatch.webp",
    bonus: 1.67
  },
  {
    id: 5,
    name: "Professional Digital Camera",
    category: "Photography",
    image: "./assets/camera professiocional.jpg",
    bonus: 1.67
  },
  {
    id: 6,
    name: "Sports Shoes",
    category: "Fashion",
    image: "./assets/shoes.webp",
    bonus: 1.67
  },
  {
    id: 7,
    name: "Multifunctional Blender",
    category: "Home Appliances",
    image: "./assets/blender.jpg",
    bonus: 1.67
  },
  {
    id: 8,
    name: "Waterproof Backpack",
    category: "Accessories",
    image: "./assets/backpack.webp",
    bonus: 1.67
  },
  {
    id: 9,
    name: "Ergonomic Gaming Chair",
    category: "Furniture",
    image: "./assets/Ergonomic Gaming Chair.png",
    bonus: 1.67
  },
  {
    id: 10,
    name: "Imported Perfume",
    category: "Beauty",
    image: "./assets/Imported Perfume.webp",
    bonus: 1.67
  },
  {
    id: 11,
    name: "Luxury Watch",
    category: "Accessories",
    image: "./assets/luxury watch.webp",
    bonus: 1.67
  },
  {
    id: 12,
    name: "Multifunctional Electric Cooker",
    category: "Home Appliances",
    image: "./assets/Multifunctional Electric Cooker.jpeg",
    bonus: 1.67
  },
  {
    id: 13,
    name: "Bestseller Book",
    category: "Books",
    image: "./assets/bestseller book.webp",
    bonus: 1.67
  },
  {
    id: 14,
    name: "Console Game",
    category: "Entertainment",
    image: "./assets/console game.jpg",
    bonus: 1.67
  },
  {
    id: 15,
    name: "Professional Makeup Kit",
    category: "Beauty",
    image: "./assets/professional makeup kit.jpg",
    bonus: 1.67
  }
];

// Function to get available products for evaluation
async function getAvailableProducts(email) {
  // Check which products the user has already evaluated today
  const evaluatedToday = await getEvaluatedProductsToday(email);
  
  // Filter products that haven't been evaluated today
  return availableProducts.filter(product => !evaluatedToday.includes(product.id));
}

// Function to get products evaluated today
async function getEvaluatedProductsToday(email) {
  const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
  
  const { data, error } = await supabase
    .from('product_evaluations')
    .select('product_id')
    .eq('user_email', email)
    .gte('evaluated_at', today + 'T00:00:00Z')
    .lte('evaluated_at', today + 'T23:59:59Z');
  
  if (error) {
    console.error('Error getting evaluated products:', error);
    return [];
  }
  
  return data.map(item => item.product_id);
}

// Function to register product evaluation
async function registerProductEvaluation(email, productId, answers) {
  const now = new Date().toISOString();
  
  // Find the evaluated product
  const product = availableProducts.find(p => p.id === productId);
  if (!product) {
    console.error('Product not found:', productId);
    return null;
  }
  
  // Register the evaluation
  const { data, error } = await supabase
    .from('product_evaluations')
    .insert([
      {
        user_email: email,
        product_id: productId,
        product_name: product.name,
        answers: JSON.stringify(answers),
        evaluated_at: now,
        bonus_usd: product.bonus
      }
    ])
    .select();
  
  if (error) {
    console.error('Error registering evaluation:', error);
    return null;
  }
  
  // Update user balance
  return await updateUserBalance(email, product.bonus);
}

// Function to check if user has reached daily limit
async function checkDailyLimit(email) {
  const MAX_DAILY_EVALUATIONS = 10; // Changed to 10 products per day
  
  const evaluatedToday = await getEvaluatedProductsToday(email);
  return {
    count: evaluatedToday.length,
    limit: MAX_DAILY_EVALUATIONS,
    reachedLimit: evaluatedToday.length >= MAX_DAILY_EVALUATIONS
  };
}

// Function to get evaluation statistics
async function getEvaluationStats(email) {
  const { count: evaluatedToday } = await checkDailyLimit(email);
  const MAX_DAILY_EVALUATIONS = 10; // Changed to 10 products per day
  
  // Calculate completion percentage
  const completionPercentage = (evaluatedToday / MAX_DAILY_EVALUATIONS) * 100;
  
  return {
    evaluatedToday,
    maxDaily: MAX_DAILY_EVALUATIONS,
    completionPercentage: completionPercentage.toFixed(2),
    remaining: MAX_DAILY_EVALUATIONS - evaluatedToday
  };
}
// Function to register product evaluation
async function registerProductEvaluation(email, productId, answers) {
  const now = new Date().toISOString();
  
  // Find the evaluated product
  const product = availableProducts.find(p => p.id === productId);
  if (!product) {
    console.error('Product not found:', productId);
    return null;
  }
  
  // Calculate BRL value (using a fixed conversion rate of 5.0 BRL to 1 USD)
  const conversionRate = 5.0;
  const bonusBRL = product.bonus * conversionRate;
  
  // Register the evaluation
  const { data, error } = await supabase
    .from('product_evaluations')
    .insert([
      {
        user_email: email,
        product_id: productId,
        product_name: product.name,
        answers: JSON.stringify(answers),
        evaluated_at: now,
        bonus_usd: product.bonus,
        bonus_brl: bonusBRL  // Add the BRL value to satisfy the not-null constraint
      }
    ])
    .select();
  
  if (error) {
    console.error('Error registering evaluation:', error);
    return null;
  }
  
  // Update user balance
  return await updateUserBalance(email, product.bonus);
}

// Function to register product evaluation
async function registerProductEvaluation(email, productId, answers) {
  const now = new Date().toISOString();
  
  // Find the evaluated product
  const product = availableProducts.find(p => p.id === productId);
  if (!product) {
    console.error('Product not found:', productId);
    return null;
  }
  
  // Calculate BRL value (using a fixed conversion rate of 5.0 BRL to 1 USD)
  const conversionRate = 5.0;
  const bonusBRL = product.bonus * conversionRate;
  
  // Register the evaluation
  const { data, error } = await supabase
    .from('product_evaluations')
    .insert([
      {
        user_email: email,
        product_id: productId,
        product_name: product.name,
        answers: JSON.stringify(answers),
        evaluated_at: now,
        bonus_usd: product.bonus,
        bonus_brl: bonusBRL
      }
    ])
    .select();
  
  if (error) {
    console.error('Error registering evaluation:', error);
    return null;
  }
  
  // Update user balance
  return await updateUserBalance(email, product.bonus);
}

// Function to process Swift payment
async function processSwiftPayment(email, amount, swiftDetails) {
  // In a real application, this would connect to a payment processor
  // For now, we'll just record the transaction in the database
  
  const now = new Date().toISOString();
  const referenceId = 'SWIFT' + Math.floor(Math.random() * 1000000000);
  
  const { data, error } = await supabase
    .from('withdrawals')
    .insert([
      {
        user_email: email,
        amount_usd: amount,
        payment_method: 'swift',
        payment_details: JSON.stringify(swiftDetails),
        status: 'pending',
        reference_id: referenceId,
        created_at: now
      }
    ])
    .select();
  
  if (error) {
    console.error('Error processing Swift payment:', error);
    return null;
  }
  
  // Deduct from user balance
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('balance_usd')
    .eq('email', email)
    .single();
  
  if (userError) {
    console.error('Error getting user balance:', userError);
    return null;
  }
  
  const newBalance = userData.balance_usd - amount;
  
  const { data: updateData, error: updateError } = await supabase
    .from('users')
    .update({
      balance_usd: newBalance
    })
    .eq('email', email)
    .select();
  
  if (updateError) {
    console.error('Error updating user balance:', updateError);
    return null;
  }
  
  return {
    success: true,
    referenceId: referenceId,
    newBalance: newBalance.toFixed(2)
  };
}