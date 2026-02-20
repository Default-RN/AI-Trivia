// Measure execution time
export const measureTime = (fn, label) => {
    return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    console.log(`${label} took ${(end - start).toFixed(2)}ms`);
    return result;
};
};

// Debounce function for search inputs
export const debounce = (func, wait) => {
let timeout;
return function executedFunction(...args) {
    const later = () => {
        clearTimeout(timeout);
        func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
};
};

// Throttle for rate limiting
export const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
    if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
    }
    };
};