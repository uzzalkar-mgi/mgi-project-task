import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Axios 1.x only attaches the X-XSRF-TOKEN header when this is enabled.
// Without it, GET works but POST/PATCH/DELETE fail with 419 (CSRF).
window.axios.defaults.withXSRFToken = true;
window.axios.defaults.withCredentials = true;
