// cart.js

// Function to handle quantity updates
function updateQuantity(productId, change) {
    // Get the current quantity element
    const quantityElement = document.querySelector(`#quantity-${productId}`);
    if (quantityElement) {
        // Get the current quantity value
        let currentQuantity = parseInt(quantityElement.textContent);
        
        // Update the quantity based on the change (+1 or -1)
        currentQuantity += change;
        
        // Ensure the quantity is not negative
        currentQuantity = Math.max(currentQuantity, 0);
        
        // Update the quantity element
        quantityElement.textContent = currentQuantity;
    }
}

// Add event listeners for + and - buttons
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("btn-increase")) {
        // + button clicked
        const productId = event.target.getAttribute("data-product-id");
        updateQuantity(productId, 1);
    } else if (event.target.classList.contains("btn-decrease")) {
        // - button clicked
        const productId = event.target.getAttribute("data-product-id");
        updateQuantity(productId, -1);
    }
});
