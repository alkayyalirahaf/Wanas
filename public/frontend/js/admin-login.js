
const form = document.querySelector('#admin-login-form');
const message = document.querySelector('#admin-login-message');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const formData = new FormData(form);

    const email = String(formData.get('email')).trim().toLowerCase();
    const password = String(formData.get('password'));

    try {
        const response = await axios.post('/api/admin/login', {
            email: email,
            password: password
        });

        const token = response.data.token;
        const admin = response.data.admin;

        sessionStorage.setItem('adminToken', token);
        sessionStorage.setItem('currentUser', JSON.stringify(admin));

        window.location.assign('admin.html');

    } catch (error) {
        if (error.response?.status === 422) {
            message.textContent = 'يرجى التأكد من إدخال البيانات المطلوبة.';
        } else if (error.response?.status === 401) {
            message.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
        } else {
            message.textContent = 'حدث خطأ، حاول مرة أخرى.';
        }
    }
});
