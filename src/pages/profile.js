import './auth.css';
import { getSupabaseClient, redirectTo } from '../lib/supabase.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 2048;

const createImageBitmapAsync = async (file) => {
    if (typeof createImageBitmap === 'function') {
        return createImageBitmap(file);
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
    });
    const bitmap = {
        width: image.width,
        height: image.height,
        close: () => URL.revokeObjectURL(url)
    };
    return bitmap;
};

const processAvatar = async (file, size = 512) => {
    const bitmap = await createImageBitmapAsync(file);

    const minSide = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - minSide) / 2;
    const sy = (bitmap.height - minSide) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');

    ctx.drawImage(
        bitmap,
        sx, sy, minSide, minSide,
        0, 0, size, size
    );

    const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png', 0.9)
    );

    bitmap.close?.();

    return new File(
        [blob],
        file.name.replace(/\.[^.]+$/, '') + '.png',
        { type: 'image/png' }
    );
};


export const renderProfilePage = () => ({
    html: `
    <section class="container py-5">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-8">
          <div class="auth-card card-glow p-4 rounded-4">
            <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
              <div>
                <h2 class="fw-bold mb-1" style="border-left: 4px solid #00ffcc; border-bottom: 2px solid #00ffcc; padding-left: 10px; font-size: 2.5rem;">My Profile</h2>
                <p class="text-secondary mb-0">Manage your avatar and public nickname.</p>
              </div>
            </div>

            <div class="row g-4 align-items-start">
              <div class="col-12 col-md-4 text-center">
                <div class="mx-auto mb-3 rounded-circle border border-info border-3 overflow-hidden" style="width: 160px; height: 160px; background: rgba(255,255,255,0.06);">
                  <img id="profile-avatar-preview" src="https://placehold.co/160x160/0b1020/22d3ee?text=AV" alt="Avatar preview" class="w-100 h-100 object-fit-cover" />
                </div>
                <label class="btn btn-outline-info w-100" for="avatar-upload" style="font-weight: bold;">Upload avatar</label>
                <input id="avatar-upload" type="file" accept="image/jpeg,image/png,image/webp" class="d-none" />
              </div>

              <div class="col-12 col-md-8">
                <div id="profile-alert" class="alert d-none" role="alert"></div>
                <form id="profile-form">
                  <div class="mb-3">
                    <label class="form-label" style="font-weight: bold; text-decoration: underline;">Nickname</label>
                    <input id="profile-username" class="form-control" type="text" minlength="3" maxlength="20" placeholder="Enter nickname" required />
                  </div>
                  <div class="mb-3 text-secondary small">(Nicknames must be 3–20 characters and unique.)</div>
                  <button id="profile-save" class="btn btn-primary w-100" type="submit" style="font-weight: bold; background-color: #00ffcc; border-color: #00ffcc; color: #000; font-size: 1.2rem">Save profile</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
    onMount: async () => {
        const supabase = getSupabaseClient();

        const { data } = await supabase.auth.getUser();

        const avatarUpload = document.getElementById('avatar-upload');
        const avatarPreview = document.getElementById('profile-avatar-preview');
        const usernameInput = document.getElementById('profile-username');
        const saveButton = document.getElementById('profile-save');
        const profileAlert = document.getElementById('profile-alert');
        const profileForm = document.getElementById('profile-form');

        let currentAvatarUrl = '';
        let currentUser = null;

        const showAlert = (message, type = 'info') => {
            profileAlert.className = `alert alert-${type} d-block`;
            profileAlert.textContent = message;
        };

        const clearAlert = () => {
            profileAlert.className = 'alert d-none';
            profileAlert.textContent = '';
        };

        const loadProfile = async () => {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData?.user) {
                redirectTo('/login');
                return;
            }
            currentUser = userData.user;
            const { data, error } = await supabase.from('profiles').select('username, avatar_url').eq('id', currentUser.id).maybeSingle();
            if (error) {
                showAlert(error.message, 'danger');
                return;
            }
            if (data) {
                usernameInput.value = data.username || '';
                currentAvatarUrl = data.avatar_url || '';
                if (currentAvatarUrl) avatarPreview.src = currentAvatarUrl;
            }
        };

        const validateUsername = (value) => {
            const trimmed = value.trim();
            if (trimmed.length < 3 || trimmed.length > 20) {
                return 'Nickname must be between 3 and 20 characters.';
            }
            if (!/^[a-zA-Z0-9_\- ]+$/.test(trimmed)) {
                return 'Nickname can only contain letters, numbers, spaces, underscores, or dashes.';
            }
            return '';
        };

        const checkUsernameUnique = async (value) => {
            const trimmed = value.trim();
            if (!trimmed) return '';
            const { data, error } = await supabase.from('profiles').select('id').eq('username', trimmed).neq('id', currentUser.id).maybeSingle();
            if (error) {
                return error.message;
            }
            return data ? 'That nickname is already taken.' : '';
        };

        avatarUpload.addEventListener('change', async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!ALLOWED_TYPES.includes(file.type)) {
                showAlert('Only JPG, PNG, and WEBP images are allowed.', 'danger');
                return;
            }
            if (file.size > MAX_SIZE_BYTES) {
                showAlert('Image must be smaller than 2MB.', 'danger');
                return;
            }
            saveButton.disabled = true;
            showAlert('Preparing image…', 'info');
            try {
                const resizedFile = await processAvatar(file, 512);
                const bitmap = await createImageBitmapAsync(resizedFile);
                if (bitmap.width > MAX_DIMENSION || bitmap.height > MAX_DIMENSION) {
                    showAlert('Image dimensions must be 512x512px or smaller.', 'danger');
                    saveButton.disabled = false;
                    bitmap.close?.();
                    return;
                }
                bitmap.close?.();
                const previewUrl = URL.createObjectURL(resizedFile);
                avatarPreview.src = previewUrl;
                showAlert('Avatar ready. Save to update your profile.', 'success');
            } catch (error) {
                showAlert('Unable to process image.', 'danger');
            } finally {
                saveButton.disabled = false;
            }
        });

        profileForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearAlert();
            const username = usernameInput.value.trim();
            const usernameError = validateUsername(username);
            if (usernameError) {
                showAlert(usernameError, 'danger');
                return;
            }
            const uniqueError = await checkUsernameUnique(username);
            if (uniqueError) {
                showAlert(uniqueError, 'danger');
                return;
            }

            saveButton.disabled = true;
            saveButton.textContent = 'Saving…';
            try {
                let avatarUrl = currentAvatarUrl;
                if (avatarUpload.files?.[0]) {
                    const file = avatarUpload.files[0];
                    const squaredFile = await processAvatar(file, 512);

                    const path = `${currentUser.id}/${squaredFile.name}`;
                    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, squaredFile, {
                        upsert: true,
                        contentType: squaredFile.type
                    });
                    if (uploadError) throw uploadError;
                    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
                    avatarUrl = publicData.publicUrl;
                }

                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: currentUser.id,
                    username,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' }).select();

                if (profileError) throw profileError;
                currentAvatarUrl = avatarUrl;
                avatarUpload.value = '';
                showAlert('Profile updated successfully.', 'success');
            } catch (error) {
                showAlert(error.message || 'Unable to save profile.', 'danger');
            } finally {
                saveButton.disabled = false;
                saveButton.textContent = 'Save profile';
            }
        });

        await loadProfile();
    }
});
