import { getCurrentUser, getSupabaseClient, redirectTo } from '../lib/supabase.js';
import playerImg from '../assets/player.jpg';
import zombieImg from '../assets/zombie.jpg';

export const renderHeader = () => {
    const root = document.getElementById('header-root');
    root.innerHTML = `
    <header class="navbar navbar-expand-lg navbar-dark bg-dark px-3 py-0">
      <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="/" data-route>Survivor Game</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav ms-auto gap-3" id="header-nav"></ul>
        </div>
      </div>
    </header>
  `;

    const renderNav = async () => {
        const nav = document.getElementById('header-nav');
        const user = await getCurrentUser();

        nav.insertAdjacentHTML('beforeend', `
        <div class="nav-icons">
            <img src="${zombieImg}" class="icon zombie" alt="Zombie" height="50" width="45">
            <img src="${playerImg}" class="icon player" alt="Player" height="50" width="45">
            <img src="${zombieImg}" class="icon zombie" alt="Zombie" height="50" width="45">
        </div>
    `);

        if (user) {
            nav.innerHTML = `
        <li class="nav-item"><a id="dashboardBtn" class="nav-link" href="/dashboard" data-route>Dashboard</a></li>
        <li class="nav-item"><a id="profileBtn" class="nav-link" href="/profile" data-route>Profile</a></li>
        <button id="logout-button" class="btn btn-outline-light btn-sm" style="font-weight:bold">Logout</button>
        `;
        }


        if (user && window.location.pathname === "/dashboard") {
            document.getElementById("dashboardBtn").style.display = "none";
        }

        if (user && window.location.pathname === "/profile") {
            document.getElementById("profileBtn").style.display = "none";
        }


        //*if (!user) {
        //*  nav.innerHTML = `
        //*    <li class="nav-item"><a class="nav-link" href="/" data-route>Home</a></li>
        //*    <li class="nav-item"><a class="nav-link" href="/login" data-route>Login</a></li>
        //*    <li class="nav-item"><a class="nav-link" href="/register" data-route>Register</a></li>
        //*  `;
        //*  return;
        //*}
        //*nav.innerHTML = `
        //*  <li class="nav-item"><a class="nav-link" href="/" data-route>Home</a></li>
        //*  <li class="nav-item"><a class="nav-link" href="/dashboard" data-route>Dashboard</a></li>
        //*  <li class="nav-item"><a class="nav-link" href="/profile" data-route>Profile</a></li>
        //*  <li class="nav-item">
        //*    <button id="logout-button" class="btn btn-outline-light btn-sm">Logout</button>
        //*  </li>
        //*`;
        const logoutButton = document.getElementById('logout-button');
        logoutButton.addEventListener('click', async () => {
            const supabase = getSupabaseClient();
            await supabase.auth.signOut();
            redirectTo('/');
        });
    };

    renderNav();
};
