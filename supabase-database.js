// Supabase Database Operations - Booking Requests, Orders, and Realtime

// ==================== BOOKING REQUESTS ====================

// Create a new booking request
async function createBookingRequest(productId, productName, price, mudraReward) {
  try {
    const user = await getCurrentSupabaseUser();
    if (!user) {
      alert('Please login to create a booking request');
      return null;
    }

    const bookingData = {
      user_id: user.id,
      member_id: currentUser.memberId,
      product_id: productId,
      product_name: productName,
      price: price,
      mudra_reward: mudraReward,
      status: 'pending',
      created_at: new Date().toISOString(),
      notes: `Booking request for ${productName}`
    };

    const { data, error } = await supabaseClient
      .from('booking_requests')
      .insert([bookingData])
      .select();

    if (error) {
      console.error('Create booking error:', error);
      alert('Failed to create booking request: ' + error.message);
      return null;
    }

    console.log('Booking request created:', data);
    logDeveloperEvent(`BOOKING REQUEST CREATED: ${productName} | ID: ${data[0]?.id}`);
    
    return data[0];
  } catch (err) {
    console.error('Create booking exception:', err);
    alert('An error occurred while creating booking request');
    return null;
  }
}

// Get all booking requests for current user
async function getUserBookingRequests() {
  try {
    const user = await getCurrentSupabaseUser();
    if (!user) return [];

    const { data, error } = await supabaseClient
      .from('booking_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get bookings error:', error);
      return [];
    }

    console.log('User bookings:', data);
    return data || [];
  } catch (err) {
    console.error('Get bookings exception:', err);
    return [];
  }
}

// Update booking request status
async function updateBookingStatus(bookingId, newStatus) {
  try {
    const { data, error } = await supabaseClient
      .from('booking_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select();

    if (error) {
      console.error('Update booking error:', error);
      return null;
    }

    logDeveloperEvent(`BOOKING STATUS UPDATED: ${bookingId} -> ${newStatus}`);
    return data[0];
  } catch (err) {
    console.error('Update booking exception:', err);
    return null;
  }
}

// ==================== ORDERS ====================

// Create order from booking request
async function createOrder(bookingRequestId, paymentId) {
  try {
    const user = await getCurrentSupabaseUser();
    if (!user) return null;

    // Get booking request details
    const { data: bookingData, error: bookingError } = await supabaseClient
      .from('booking_requests')
      .select('*')
      .eq('id', bookingRequestId)
      .single();

    if (bookingError || !bookingData) {
      console.error('Get booking error:', bookingError);
      return null;
    }

    const orderData = {
      user_id: user.id,
      member_id: currentUser.memberId,
      booking_request_id: bookingRequestId,
      product_id: bookingData.product_id,
      product_name: bookingData.product_name,
      price: bookingData.price,
      mudra_reward: bookingData.mudra_reward,
      payment_id: paymentId,
      order_status: 'confirmed',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseClient
      .from('orders')
      .insert([orderData])
      .select();

    if (error) {
      console.error('Create order error:', error);
      return null;
    }

    // Update booking status to confirmed
    await updateBookingStatus(bookingRequestId, 'confirmed');

    logDeveloperEvent(`ORDER CREATED: ${data[0]?.id} | Payment: ${paymentId}`);
    return data[0];
  } catch (err) {
    console.error('Create order exception:', err);
    return null;
  }
}

// Get user orders
async function getUserOrders() {
  try {
    const user = await getCurrentSupabaseUser();
    if (!user) return [];

    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get orders error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Get orders exception:', err);
    return [];
  }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .update({ order_status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select();

    if (error) {
      console.error('Update order error:', error);
      return null;
    }

    logDeveloperEvent(`ORDER STATUS UPDATED: ${orderId} -> ${newStatus}`);
    return data[0];
  } catch (err) {
    console.error('Update order exception:', err);
    return null;
  }
}

// ==================== REALTIME SUBSCRIPTIONS ====================

// Subscribe to booking request changes (realtime)
function subscribeToBookingRequests(userId, callback) {
  const subscription = supabaseClient
    .from(`booking_requests:user_id=eq.${userId}`)
    .on('*', payload => {
      console.log('Booking update:', payload);
      logDeveloperEvent(`REALTIME: Booking update - ${payload.eventType}`);
      if (callback) callback(payload);
    })
    .subscribe();

  return subscription;
}

// Subscribe to orders (realtime)
function subscribeToOrders(userId, callback) {
  const subscription = supabaseClient
    .from(`orders:user_id=eq.${userId}`)
    .on('*', payload => {
      console.log('Order update:', payload);
      logDeveloperEvent(`REALTIME: Order update - ${payload.eventType}`);
      if (callback) callback(payload);
    })
    .subscribe();

  return subscription;
}

// Subscribe to all booking requests (admin view)
function subscribeToAllBookingRequests(callback) {
  const subscription = supabaseClient
    .from('booking_requests')
    .on('*', payload => {
      console.log('All bookings update:', payload);
      if (callback) callback(payload);
    })
    .subscribe();

  return subscription;
}

// Unsubscribe from updates
function unsubscribeFromUpdates(subscription) {
  if (subscription) {
    supabaseClient.removeSubscription(subscription);
  }
}

// ==================== USER PROFILES ====================

// Create user profile
async function createUserProfile(userData) {
  try {
    const user = await getCurrentSupabaseUser();
    if (!user) return null;

    const profileData = {
      user_id: user.id,
      email: user.email,
      full_name: userData.name || user.user_metadata?.full_name,
      phone: userData.contact || user.user_metadata?.phone,
      member_id: currentUser.memberId,
      mudra_gold: 0,
      mudra_silver: 0,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseClient
      .from('user_profiles')
      .upsert([profileData], { onConflict: 'user_id' })
      .select();

    if (error) {
      console.error('Create profile error:', error);
      return null;
    }

    logDeveloperEvent(`USER PROFILE CREATED/UPDATED`);
    return data[0];
  } catch (err) {
    console.error('Create profile exception:', err);
    return null;
  }
}

// Get user profile
async function getUserProfile() {
  try {
    const user = await getCurrentSupabaseUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Get profile error:', error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error('Get profile exception:', err);
    return null;
  }
}

// Update user Mudra balance
async function updateMudraBalance(mudraGold, mudraSilver) {
  try {
    const user = await getCurrentSupabaseUser();
    if (!user) return null;

    const { data, error } = await supabaseClient
      .from('user_profiles')
      .update({ 
        mudra_gold: mudraGold,
        mudra_silver: mudraSilver,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Update mudra error:', error);
      return null;
    }

    logDeveloperEvent(`MUDRA BALANCE UPDATED: Gold ${mudraGold}, Silver ${mudraSilver}`);
    return data[0];
  } catch (err) {
    console.error('Update mudra exception:', err);
    return null;
  }
}

// ==================== PAYMENT TRACKING ====================

// Store payment details
async function storePaymentDetails(orderId, paymentData) {
  try {
    const paymentInfo = {
      order_id: orderId,
      payment_id: paymentData.razorpay_payment_id,
      amount: paymentData.amount,
      currency: 'INR',
      status: 'completed',
      payment_method: paymentData.method || 'razorpay',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabaseClient
      .from('payments')
      .insert([paymentInfo])
      .select();

    if (error) {
      console.error('Store payment error:', error);
      return null;
    }

    logDeveloperEvent(`PAYMENT STORED: ${paymentData.razorpay_payment_id}`);
    return data[0];
  } catch (err) {
    console.error('Store payment exception:', err);
    return null;
  }
}

// Get payment details
async function getPaymentDetails(orderId) {
  try {
    const { data, error } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Get payment error:', error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error('Get payment exception:', err);
    return null;
  }
}
