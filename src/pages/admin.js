import { getSupabaseClient } from '../lib/supabase.js';
import './admin.css';

export const renderAdminPage = () => {

    return {

        html: `

        <section class="admin-page container py-5">

            <h1 class="admin-title">
                ⚡ ADMIN CONTROL PANEL
            </h1>


            <p class="admin-subtitle">
                Manage survivors and permissions
            </p>


            <div 
                id="users-container"
                class="users-grid">
                
                Loading...

            </div>

        </section>

        `,

        onMount: async () => {

            const supabase = getSupabaseClient();

            const container =
                document.getElementById('users-container');

            const {
                data: {
                    user
                }
            } = await supabase.auth.getUser();

            if (!user) {
                container.innerHTML =
                    `
                <div class="error-box">
                    Login required
                </div>
                `;

                return;
            }

            const {
                data: adminProfile
            } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (adminProfile.role !== 'admin') {

                container.innerHTML =
                    `
                <div class="error-box">
                    Access denied
                </div>
                `;

                return;
            }

            await loadUsers();

            async function loadUsers() {

                const {
                    data: users,
                    error
                } =
                    await supabase
                        .from('profiles')
                        .select(`
                    id,
                    username,
                    avatar_url,
                    role,
                    created_at
                `)
                        .order(
                            'created_at',
                            {
                                ascending: false
                            }
                        );

                if (error) {

                    console.error(error);

                    return;
                }

                container.innerHTML = users.map(profile => `

                <div class="user-card">

                    <div class="avatar-wrapper">

                        <img
                        src="${profile.avatar_url ||
                    'https://ui-avatars.com/api/?name=' +
                    profile.username
                    }"
                        class="user-avatar"
                        >

                    </div>

                    <div class="user-info">

                        <h3>
                            ${profile.username}
                        </h3>

                        <span class="
                        role-badge
                        ${profile.role === 'admin'
                        ? 'admin'
                        : 'user'
                    }
                        ">
                            ${profile.role.toUpperCase()
                    }
                        </span>

                        <p class="created-date">
                            Joined:
                            ${new Date(
                        profile.created_at
                    )
                        .toLocaleDateString()
                    }
                        </p>
                    </div>

                    <div class="user-actions">
                        <button
                        class="switch-role"
                        data-id="${profile.id}"
                        data-role="${profile.role}"
                        >
                            🔄 Switch Role
                        </button>
                    </div>

                </div>

                `).join('');

                attachEvents();
            }

            function attachEvents() {

                document
                    .querySelectorAll('.switch-role')
                    .forEach(btn => {

                        btn.onclick = async () => {

                            const newRole =
                                btn.dataset.role === 'admin'
                                    ? 'user'
                                    : 'admin';

                            await supabase
                                .from('profiles')
                                .update({
                                    role: newRole
                                })
                                .eq(
                                    'id',
                                    btn.dataset.id
                                );

                            loadUsers();
                        };
                    });

                document
                    .querySelectorAll('.delete-user')
                    .forEach(btn => {

                        btn.onclick = async () => {


                            const confirmDelete =
                                confirm(
                                    'Delete this survivor?'
                                );

                            if (!confirmDelete)
                                return;

                            await supabase
                                .from('profiles')
                                .delete()
                                .eq(
                                    'id',
                                    btn.dataset.id
                                );

                            loadUsers();

                        };

                    });
            }
        }
    };
};