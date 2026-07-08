import { getCurrentUser, redirectTo } from './lib/supabase.js';
import { renderLayout } from './components/layout.js';
import { renderRegisterPage } from './pages/register.js';
import { renderLoginPage } from './pages/login.js';
import { renderHomePage } from './pages/home.js';
import { renderProfilePage } from './pages/profile.js';
import { renderDashboardPage } from './pages/dashboard.js';


const routes = [
    { path: '/', view: renderHomePage },
    { path: '/login', view: renderLoginPage },
    { path: '/register', view: renderRegisterPage },
    { path: '/profile', view: renderProfilePage, protected: true },
    { path: '/dashboard', view: renderDashboardPage, protected: true }
];

const parseRoute = () => {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const match = routes.find((route) => matchRoute(route.path, path));
    return match ? { ...match, params: getParams(match.path, path) } : null;
};

const matchRoute = (pattern, pathname) => {
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, '([^/]+)')}$`);
    return regex.test(pathname);
};

const getParams = (pattern, pathname) => {
    const keys = pattern.match(/:[^/]+/g)?.map((key) => key.slice(1)) ?? [];
    const values = pathname.match(new RegExp(`^${pattern.replace(/:[^/]+/g, '([^/]+)')}$`))?.slice(1) ?? [];
    return Object.fromEntries(keys.map((key, index) => [key, values[index]]));
};

export const initRouter = () => {

    const render = async () => {
        const route = parseRoute();
        const app = document.getElementById('app');

        if (!route) {
            app.innerHTML = '<div class="container py-5"><h1>Not found</h1></div>';
            return;
        }

        if (route.protected) {
            const user = await getCurrentUser();

            if (!user) {
                redirectTo('/login');
                return;
            }
        }

        renderLayout(route.view, route.params);
    };

    window.addEventListener('popstate', render);
    window.addEventListener('auth:changed', render);
    document.addEventListener('click', (event) => {
        const anchor = event.target.closest('a[data-route]');
        if (!anchor) return;
        event.preventDefault();
        const target = anchor.getAttribute('href');
        window.history.pushState({}, '', target);
        render();
    });

    render();
};
