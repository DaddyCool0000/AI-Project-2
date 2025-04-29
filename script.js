// Replace with your Gemini API key
const GEMINI_API_KEY = 'AIzaSyBPidFSncARX8NzUT_ZAJMOhVm_4V9kMQk';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';

// DOM Elements
const startBtn = document.getElementById('start-btn');
const stopSpeechBtn = document.getElementById('stop-speech-btn');
const status = document.getElementById('status');
const chatLog = document.getElementById('chat-log');
const wishlistItems = document.getElementById('wishlist-items');
const wishlistCount = document.getElementById('wishlist-count');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');

// Wishlist state
let wishlist = [];

// Cart state
let cart = [];

// Price mapping for common items
const priceMap = {
    // Electronics
    'iphone': 79999,
    'samsung': 49999,
    'laptop': 59999,
    'headphones': 2999,
    'smartwatch': 9999,
    'tablet': 24999,
    'speaker': 3999,
    'camera': 29999,
    'gaming console': 39999,
    'smart tv': 34999,

    // Fashion - Men
    'men tshirt': 999,
    'men shirt': 1499,
    'men jeans': 1999,
    'men jacket': 3999,
    'men shoes': 2999,
    'men sneakers': 2499,
    'men formal shoes': 3499,
    'men watch': 4999,
    'men sunglasses': 1999,
    'men wallet': 999,

    // Fashion - Women
    'women dress': 1999,
    'women top': 999,
    'women jeans': 1799,
    'women jacket': 3499,
    'women shoes': 2499,
    'women heels': 2999,
    'women handbag': 3999,
    'women watch': 4499,
    'women sunglasses': 1799,
    'women jewelry': 2999,

    // Kids
    'kids tshirt': 599,
    'kids dress': 999,
    'kids shoes': 1499,
    'kids toys': 999,
    'kids watch': 1999,
    'kids backpack': 799,
    'kids bicycle': 4999,
    'kids books': 299,
    'kids stationery': 499,
    'kids games': 1499,

    // Grocery
    'rice': 499,
    'wheat flour': 299,
    'sugar': 49,
    'salt': 20,
    'oil': 199,
    'milk': 60,
    'eggs': 60,
    'bread': 40,
    'butter': 100,
    'cheese': 199,

    // Home Appliances
    'refrigerator': 29999,
    'washing machine': 19999,
    'microwave': 8999,
    'air conditioner': 34999,
    'water purifier': 12999,
    'vacuum cleaner': 7999,
    'iron': 1999,
    'fan': 1999,
    'geyser': 9999,
    'mixer grinder': 2999,

    // Kitchen
    'cookware set': 4999,
    'knife set': 1999,
    'pressure cooker': 1999,
    'rice cooker': 2999,
    'blender': 2499,
    'coffee maker': 3999,
    'toaster': 1499,
    'food processor': 4999,
    'kitchen scale': 999,
    'storage containers': 999,

    // Home Decor
    'wall clock': 999,
    'photo frame': 499,
    'candles': 299,
    'vase': 799,
    'wall art': 1999,
    'cushions': 599,
    'curtains': 1999,
    'rug': 2999,
    'lamps': 1499,
    'mirror': 1999,

    // Sports & Fitness
    'yoga mat': 999,
    'dumbbells': 1499,
    'treadmill': 29999,
    'bicycle': 9999,
    'sports shoes': 2999,
    'gym bag': 999,
    'fitness tracker': 3999,
    'sports watch': 4999,
    'tennis racket': 2999,
    'cricket bat': 1999,

    // Books & Stationery
    'novel': 299,
    'notebook': 199,
    'pen set': 499,
    'backpack': 1999,
    'lunch box': 499,
    'water bottle': 299,
    'calculator': 499,
    'art supplies': 999,
    'desk organizer': 799,
    'file folder': 299,

    // Pet Supplies
    'dog food': 999,
    'cat food': 799,
    'pet bed': 1499,
    'pet toys': 499,
    'pet leash': 299,
    'pet collar': 199,
    'pet bowl': 199,
    'pet grooming kit': 999,
    'pet carrier': 1999,
    'pet treats': 299,

    // Beauty & Personal Care
    'shampoo': 299,
    'conditioner': 299,
    'face wash': 199,
    'moisturizer': 399,
    'perfume': 999,
    'makeup kit': 1999,
    'hair dryer': 1499,
    'trimmer': 999,
    'razor': 299,
    'nail polish': 199
};

// Check browser support
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    startBtn.disabled = true;
    status.textContent = "Speech recognition not supported";
}

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
}

// Add conversation memory
let conversationHistory = [];
const MAX_HISTORY_LENGTH = 10; // Keep last 10 messages

// Speech Synthesis Setup
const synth = window.speechSynthesis;
let currentUtterance = null;

// Add state tracking
let isListening = false;

// Initialize chat interface
function initializeChatInterface() {
    const chatInterface = document.querySelector('.chat-interface');
    if (!chatInterface) return;

    // Add chat header
    const header = document.createElement('div');
    header.className = 'chat-header';
    header.innerHTML = `
        <div class="bot-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="bot-info">
            <h3>Shopping Assistant</h3>
            <div class="bot-status">
                <span class="status-dot"></span>
                <span class="status-text">Online</span>
            </div>
        </div>
    `;
    chatInterface.insertBefore(header, chatInterface.firstChild);
}

// Update addMessage to store conversation history
function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'assistant-message');
    
    // Add message avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = isUser ? 
        '<i class="fas fa-user"></i>' : 
        '<i class="fas fa-robot"></i>';
    
    // Format message content
    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="animate-text">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="animate-text">$1</em>')
        .replace(/\n\s*[-*]\s/g, '<br>• ')
        .replace(/\n\s*\d+\.\s/g, '<br>')
        .replace(/\n/g, '<br>')
        .replace(/\|(.*?)\|/g, '<span class="feature-highlight">$1</span>');
    
    // Create message content
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = formattedText;
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    messageDiv.appendChild(timestamp);
    
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
    
    // Store message in conversation history
    conversationHistory.push({
        text: text,
        isUser: isUser,
        timestamp: new Date()
    });
    
    // Keep only the last MAX_HISTORY_LENGTH messages
    if (conversationHistory.length > MAX_HISTORY_LENGTH) {
        conversationHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH);
    }
}

// Enhanced typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="bot-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatLog.appendChild(typingDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
    return typingDiv;
}

// Add removeTypingIndicator function
function removeTypingIndicator(typingDiv) {
    if (typingDiv && typingDiv.parentNode) {
        typingDiv.parentNode.removeChild(typingDiv);
    }
}

// Play message sound
function playMessageSound(isUser) {
    try {
        // Use a simple beep sound instead of missing audio files
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU';
        audio.volume = 0.2;
        audio.play().catch(() => {}); // Ignore errors if sound can't play
    } catch (error) {
        console.log('Sound playback not available');
    }
}

// Enhanced status updates
function updateStatus(text, isListening = false) {
    const status = document.getElementById('status');
    if (!status) return;
    
    status.textContent = text;
    status.className = isListening ? 'listening' : '';
    
    // Add wave animation to icon
    const icon = document.createElement('i');
    icon.className = isListening ? 'fas fa-microphone-alt' : 'fas fa-microphone';
    status.prepend(icon);
}

// Stop speech synthesis
function stopSpeaking() {
    if (synth.speaking) {
        synth.cancel();
        stopSpeechBtn.disabled = true;
    }
}

// Speak text using speech synthesis
function speak(text) {
    if (synth.speaking) {
        synth.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    
    utterance.onstart = () => {
        stopSpeechBtn.disabled = false;
    };
    
    utterance.onend = () => {
        stopSpeechBtn.disabled = true;
    };
    
    currentUtterance = utterance;
    synth.speak(utterance);
}

// Add quantity controls to cart items
function updateQuantity(index, change) {
    const item = cart[index];
    const newQuantity = (item.quantity || 1) + change;
    
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }
    
    item.quantity = newQuantity;
    updateCartDisplay();
}

// Enhanced updateCartDisplay function
function updateCartDisplay() {
    cartCount.textContent = `${cart.length} ${cart.length === 1 ? 'item' : 'items'}`;
    cartCount.classList.add('animate-count');
    setTimeout(() => cartCount.classList.remove('animate-count'), 500);
    
    const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    cartTotal.textContent = `₹${total.toFixed(2)}`;
    cartTotal.classList.add('animate-total');
    setTimeout(() => cartTotal.classList.remove('animate-total'), 500);
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <p>Add items to get started!</p>
            </div>`;
        return;
    }
    
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item" style="animation-delay: ${index * 0.1}s">
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                ${item.brand ? `<span class="item-brand">${item.brand}</span>` : ''}
                <span class="item-price">
                    <i class="fas fa-rupee-sign"></i>
                    ${item.price.toFixed(2)}
                    ${item.quantity > 1 ? ` × ${item.quantity}` : ''}
                </span>
                ${item.description ? `<span class="item-description">${item.description}</span>` : ''}
                ${item.features ? `
                    <div class="item-features">
                        ${item.features.map(feature => `
                            <span class="feature">
                                <i class="fas fa-check"></i>
                                ${feature}
                            </span>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-value">${item.quantity || 1}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <button class="remove-item" onclick="removeFromCart(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Function to fetch product details from API
async function fetchProductDetails(productName) {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Get me the following details for ${productName}:
                        1. Exact product name
                        2. Current market price in INR
                        3. Brief description
                        4. Key features
                        5. Brand
                        
                        Format the response as JSON:
                        {
                            "name": "exact product name",
                            "price": price in INR,
                            "description": "brief description",
                            "features": ["feature1", "feature2"],
                            "brand": "brand name"
                        }`
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const productInfo = JSON.parse(data.candidates[0].content.parts[0].text);
        return productInfo;
    } catch (error) {
        console.error('Error fetching product details:', error);
        return null;
    }
}

// Add to wishlist function
async function addToWishlist(item) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = '<div></div><div></div>';
    document.body.appendChild(loadingDiv);
    
    try {
        const productDetails = await fetchProductDetails(item.name);
        
        if (productDetails) {
            // Check if item already exists in wishlist
            const existingItemIndex = wishlist.findIndex(i => i.name.toLowerCase() === productDetails.name.toLowerCase());
            
            if (existingItemIndex === -1) {
                // Add new item
                wishlist.push({
                    ...productDetails,
                    addedAt: new Date()
                });
                showSuccessMessage(`Added ${productDetails.name} to wishlist`);
            } else {
                showSuccessMessage(`${productDetails.name} is already in your wishlist`);
            }
        } else {
            // Fallback to basic item
            wishlist.push({
                ...item,
                addedAt: new Date()
            });
            showSuccessMessage(`Added ${item.name} to wishlist`);
        }
    } catch (error) {
        console.error('Error adding item to wishlist:', error);
        showErrorMessage('Failed to add item to wishlist');
    } finally {
        if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
        }
    }
    
    updateWishlistDisplay();
}

// Show success message
function showSuccessMessage(message) {
    const successMessage = document.createElement('div');
    successMessage.className = 'wishlist-success-message';
    successMessage.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <h4>${message}</h4>
    `;
    
    document.body.appendChild(successMessage);
    setTimeout(() => {
        successMessage.classList.add('show');
        setTimeout(() => {
            successMessage.classList.remove('show');
            setTimeout(() => successMessage.remove(), 500);
        }, 2000);
    }, 100);
}

// Show error message
function showErrorMessage(message) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'wishlist-error-message';
    errorMessage.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <h4>${message}</h4>
    `;
    
    document.body.appendChild(errorMessage);
    setTimeout(() => {
        errorMessage.classList.add('show');
        setTimeout(() => {
            errorMessage.classList.remove('show');
            setTimeout(() => errorMessage.remove(), 500);
        }, 2000);
    }, 100);
}

// Remove from wishlist function
function removeFromWishlist(index) {
    const removedItem = wishlist[index];
    wishlist.splice(index, 1);
    
    const removedMessage = document.createElement('div');
    removedMessage.className = 'wishlist-removed-message';
    removedMessage.innerHTML = `
        <i class="fas fa-trash"></i>
        <h4>Removed ${removedItem.name}</h4>
        <button class="undo-remove" onclick="undoRemove(${JSON.stringify(removedItem)})">
            <i class="fas fa-undo"></i>
            Undo
        </button>
    `;
    
    document.body.appendChild(removedMessage);
    setTimeout(() => {
        removedMessage.classList.add('show');
        setTimeout(() => {
            removedMessage.classList.remove('show');
            setTimeout(() => removedMessage.remove(), 500);
        }, 2000);
    }, 100);
    
    updateWishlistDisplay();
}

// Undo remove item
function undoRemove(item) {
    wishlist.push(item);
    updateWishlistDisplay();
    showSuccessMessage(`Restored ${item.name} to wishlist`);
}

// Update wishlist display
function updateWishlistDisplay() {
    wishlistCount.textContent = `${wishlist.length} ${wishlist.length === 1 ? 'item' : 'items'}`;
    wishlistCount.classList.add('animate-count');
    setTimeout(() => wishlistCount.classList.remove('animate-count'), 500);
    
    if (wishlist.length === 0) {
        wishlistItems.innerHTML = `
            <div class="empty-wishlist">
                <i class="fas fa-heart"></i>
                <p>Your wishlist is empty</p>
                <p>Add items to get started!</p>
            </div>`;
        return;
    }
    
    wishlistItems.innerHTML = wishlist.map((item, index) => `
        <div class="wishlist-item" style="animation-delay: ${index * 0.1}s">
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                ${item.brand ? `<span class="item-brand">${item.brand}</span>` : ''}
                <span class="item-price">
                    <i class="fas fa-rupee-sign"></i>
                    ${item.price.toFixed(2)}
                </span>
                ${item.description ? `<span class="item-description">${item.description}</span>` : ''}
                ${item.features ? `
                    <div class="item-features">
                        ${item.features.map(feature => `
                            <span class="feature">
                                <i class="fas fa-check"></i>
                                ${feature}
                            </span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <button class="remove-item" onclick="removeFromWishlist(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeChatInterface();
    
    // Add welcome message
    setTimeout(() => {
        addMessage("👋 Hi! I'm your shopping assistant. How can I help you today?", false);
    }, 1000);
    
    // Add click event listener to start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', handleStartStopButton);
    } else {
        console.error('Start button not found');
    }
});

// Update speech recognition settings
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = 'en-US';
recognition.maxAlternatives = 1;

// Speech recognition event handlers
recognition.onstart = () => {
    isListening = true;
    startBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
    status.textContent = "Listening...";
    startBtn.classList.add('active');
};

recognition.onend = () => {
    isListening = false;
    startBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Talking';
    status.textContent = "Click the button to start speaking";
    startBtn.classList.remove('active');
    
    // Automatically restart recognition if it ended unexpectedly
    if (!recognition.stopped) {
        try {
            recognition.start();
        } catch (error) {
            console.error('Error restarting speech recognition:', error);
        }
    }
};

recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    status.textContent = "Error occurred. Please try again.";
    startBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Talking';
    startBtn.classList.remove('active');
    
    // Handle specific errors
    if (event.error === 'no-speech') {
        status.textContent = "No speech detected. Please try again.";
    } else if (event.error === 'audio-capture') {
        status.textContent = "No microphone detected. Please check your microphone settings.";
    }
};

// Add interim results handling
recognition.onresult = async (event) => {
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += transcript;
        } else {
            interimTranscript += transcript;
        }
    }
    
    // Only process when we have a final transcript
    if (finalTranscript) {
        addMessage(finalTranscript, true);
        status.textContent = "Processing your request...";
        
        // Get context from conversation history
        const context = conversationHistory
            .filter(msg => !msg.isUser)
            .slice(-3)
            .map(msg => msg.text)
            .join('\n');
            
        const response = await getGeminiResponse(finalTranscript, context);
        addMessage(response);
        speak(response);
        status.textContent = "Click the button to start speaking";
    }
};

// Single handler for start/stop button
function handleStartStopButton() {
    if (isListening) {
        recognition.stopped = true; // Mark as stopped by user
        recognition.stop();
    } else {
        try {
            recognition.stopped = false; // Reset stopped flag
            recognition.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            status.textContent = "Error starting speech recognition. Please try again.";
        }
    }
}

// Function to format product details into HTML table
function formatProductDetails(product) {
    return `
        <div class="product-card">
            <h3 class="product-title">${product.name}</h3>
            <div class="product-info">
                <table class="product-table">
                    <tr>
                        <th>Price</th>
                        <td>₹${product.price.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                        <th>Brand</th>
                        <td>${product.brand}</td>
                    </tr>
                </table>
                
                <div class="product-description">
                    <h4>Description</h4>
                    <p>${product.description}</p>
                </div>
                
                <div class="product-features">
                    <h4>Key Features</h4>
                    <ul>
                        ${product.features.map(feature => `
                            <li><i class="fas fa-check-circle"></i> ${feature}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// Function to format product comparison
function formatProductComparison(products) {
    return `
        <div class="comparison-card">
            <h3>Product Comparison</h3>
            <div class="comparison-table-wrapper">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Feature</th>
                            ${products.map(p => `<th>${p.name}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Price</td>
                            ${products.map(p => `<td>₹${p.price.toLocaleString('en-IN')}</td>`).join('')}
                        </tr>
                        <tr>
                            <td>Brand</td>
                            ${products.map(p => `<td>${p.brand}</td>`).join('')}
                        </tr>
                        ${products[0].features.map((_, i) => `
                            <tr>
                                <td>Feature ${i + 1}</td>
                                ${products.map(p => `<td>${p.features[i] || '-'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Update getGeminiResponse to use the new formatting
async function getGeminiResponse(prompt, context = '') {
    const typingIndicator = showTypingIndicator();
    
    try {
        // Check for wishlist-related commands
        const addToWishlistMatch = prompt.match(/add\s+(.+?)\s+(?:to\s+)?wishlist/i);
        if (addToWishlistMatch) {
            const itemName = addToWishlistMatch[1].trim();
            
            // Fetch product details from API
            const productDetails = await fetchProductDetails(itemName);
            
            if (productDetails) {
                await addToWishlist({
                    name: productDetails.name,
                    price: productDetails.price,
                    description: productDetails.description,
                    brand: productDetails.brand,
                    features: productDetails.features
                });
                
                removeTypingIndicator(typingIndicator);
                return formatProductDetails(productDetails);
            } else {
                // Fallback to basic item addition if API fails
                const basicItem = {
                    name: itemName,
                    price: 999,
                    description: "No description available",
                    brand: "Unknown",
                    features: ["Basic feature"]
                };
                await addToWishlist(basicItem);
                
                removeTypingIndicator(typingIndicator);
                return formatProductDetails(basicItem);
            }
        }

        // Handle product comparison queries
        const comparisonMatch = prompt.match(/compare|vs|versus/i);
        if (comparisonMatch) {
            const products = await fetchMultipleProducts(prompt);
            if (products && products.length > 1) {
                return formatProductComparison(products);
            }
        }

        // Format regular responses with better structure
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a helpful shopping assistant. Format your response in a clear, structured way using HTML tables and lists where appropriate. Consider the previous context:
                        ${context}
                        
                        Current query: ${prompt}
                        
                        If discussing products, include their key features in a table format.
                        If making recommendations, clearly highlight the pros and cons.
                        Use appropriate icons and formatting to make the information easy to scan.`
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.candidates?.[0]?.content?.parts?.[0]) {
            throw new Error('Invalid response format from Gemini API');
        }

        const responseText = data.candidates[0].content.parts[0].text;
        removeTypingIndicator(typingIndicator);
        
        // Format the response with enhanced styling
        return `<div class="structured-response">
            ${responseText.replace(/\n/g, '<br>')}
        </div>`;
    } catch (error) {
        console.error('Error in getGeminiResponse:', error);
        removeTypingIndicator(typingIndicator);
        return `<div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>I'm sorry, I encountered an error while processing your request. Please try again.</p>
        </div>`;
    }
}