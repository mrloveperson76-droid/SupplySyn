// js/loader.js
const loader = document.getElementById('loader-backdrop');

export function showLoader() {
    if (loader) {
        loader.classList.remove('hidden');
    }
}

export function hideLoader() {
    if (loader) {
        loader.classList.add('hidden');
    }
}