/**
 * StructureX — Authentication Controller
 * Handles form switching and mock authentication flow.
 */

document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const authTabs = document.querySelector('.auth-tabs');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const termsCheckbox = signupForm.querySelector('.terms input');

    // Tab Switching Logic
    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        authTabs.classList.remove('signup-active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    });

    tabSignup.addEventListener('click', () => {
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        authTabs.classList.add('signup-active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    // Mock Login Logic
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const btn = loginForm.querySelector('.btn-primary');
        
        // Show loading state
        btn.disabled = true;
        btn.innerHTML = '<span>Authenticating...</span><div class="spinner"></div>';
        
        console.log(`Logging in user: ${email}`);
        
        // Mock delay for "Realism"
        setTimeout(() => {
            localStorage.setItem('sx_user', JSON.stringify({ email, name: 'User' }));
            window.location.href = '/dashboard';
        }, 1500);
    });

    // Mock Signup Logic
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const btn = signupForm.querySelector('.btn-primary');
        
        btn.disabled = true;
        btn.innerHTML = '<span>Creating Account...</span><div class="spinner"></div>';
        
        console.log(`Signing up user: ${name} (${email})`);
        
        setTimeout(() => {
            localStorage.setItem('sx_user', JSON.stringify({ email, name }));
            window.location.href = '/dashboard';
        }, 2000);
    });

    // Google Login Mock
    const googleBtns = [document.getElementById('google-login'), document.getElementById('google-signup')];
    googleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.id === 'google-signup' && !termsCheckbox.checked) {
                window.alert('Please agree to the Terms & Conditions and Privacy Policy before creating an account.');
                return;
            }

            console.log('Redirecting to Google Auth...');
            btn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google"><span>Connecting...</span>';
            
            setTimeout(() => {
                localStorage.setItem('sx_user', JSON.stringify({ email: 'google_user@gmail.com', name: 'Google User' }));
                window.location.href = '/dashboard';
            }, 1000);
        });
    });

    // Parallax Stars Effect
    document.addEventListener('mousemove', (e) => {
        const stars = document.querySelector('.stars');
        if (!stars) return;
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        stars.style.transform = `translate(${x * 40}px, ${y * 40}px)`;
    });
});
