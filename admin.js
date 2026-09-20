// admin.js - Lógica para el panel de administración

const ADMIN_PASSWORD = 'admin123'; // Contraseña simple (en producción usar autenticación real)

document.addEventListener('DOMContentLoaded', () => {
    setupLogin();
    setupBusinessForm();
    setupServiceForm();
});

// Configurar login
function setupLogin() {
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    
    btnLogin.addEventListener('click', checkPassword);
    btnLogout.addEventListener('click', logout);
    
    // Permitir Enter para login
    document.getElementById('admin-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkPassword();
    });
    
    // Verificar si ya está logueado
    if (sessionStorage.getItem('adminLogged') === 'true') {
        showAdminPanel();
        loadAllData();
    }
}

// Verificar contraseña
function checkPassword() {
    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('login-error');
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLogged', 'true');
        errorMsg.style.display = 'none';
        document.getElementById('admin-password').value = '';
        showAdminPanel();
        loadAllData();
    } else {
        errorMsg.style.display = 'block';
    }
}

// Cerrar sesión
function logout() {
    sessionStorage.removeItem('adminLogged');
    hideAdminPanel();
}

// Mostrar panel de admin
function showAdminPanel() {
    document.getElementById('admin-login-section').style.display = 'none';
    document.getElementById('admin-panel-section').style.display = 'block';
}

// Ocultar panel de admin
function hideAdminPanel() {
    document.getElementById('admin-login-section').style.display = 'block';
    document.getElementById('admin-panel-section').style.display = 'none';
}

// Cargar todos los datos
async function loadAllData() {
    await loadBusinessConfig();
    await loadServices();
    await loadAppointments();
}

// Cargar configuración del negocio
async function loadBusinessConfig() {
    try {
        const { data, error } = await db.from('business_config').select('*').single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
            document.getElementById('biz-name').value = data.business_name || '';
            document.getElementById('biz-phone').value = data.phone || '';
            document.getElementById('biz-address').value = data.address || '';
        }
    } catch (error) {
        console.error('Error cargando config:', error);
    }
}

// Configurar formulario de negocio
function setupBusinessForm() {
    document.getElementById('business-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const businessData = {
            business_name: document.getElementById('biz-name').value.trim(),
            phone: document.getElementById('biz-phone').value.trim(),
            address: document.getElementById('biz-address').value.trim(),
            updated_at: new Date().toISOString()
        };
        
        try {
            // Verificar si existe
            const { data: existing } = await db.from('business_config').select('id').single();
            
            let error;
            if (existing) {
                // Actualizar
                const result = await db.from('business_config')
                    .update(businessData)
                    .eq('id', existing.id);
                error = result.error;
            } else {
                // Insertar
                const result = await db.from('business_config').insert([businessData]);
                error = result.error;
            }
            
            if (error) throw error;
            
            alert('✅ Información guardada correctamente');
        } catch (error) {
            console.error('Error guardando config:', error);
            alert('❌ Error al guardar: ' + error.message);
        }
    });
}

// Cargar servicios en el panel
async function loadServices() {
    const container = document.getElementById('admin-services-list');
    
    try {
        const { data, error } = await db.from('services').select('*').order('price', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            container.innerHTML = data.map(service => `
                <div class="service-item">
                    <div class="service-info">
                        <strong>${escapeHtml(service.name)}</strong>
                        <span>${service.price} CUP | ${service.duration} min</span>
                        ${service.description ? `<small>${escapeHtml(service.description)}</small>` : ''}
                    </div>
                    <div class="service-actions">
                        <button class="btn btn-sm btn-outline" onclick="editService(${service.id})">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteService(${service.id})">Eliminar</button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted">No hay servicios registrados</p>';
        }
    } catch (error) {
        console.error('Error cargando servicios:', error);
        container.innerHTML = '<p class="error-msg">Error al cargar servicios</p>';
    }
}

// Configurar formulario de servicios
function setupServiceForm() {
    const form = document.getElementById('service-form');
    const btnCancel = document.getElementById('btn-cancel');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const serviceId = document.getElementById('service-id').value;
        // Eliminamos updated_at manual para evitar conflicto con triggers de Supabase
        const serviceData = {
            name: document.getElementById('service-name').value.trim(),
            price: parseInt(document.getElementById('service-price').value),
            duration: parseInt(document.getElementById('service-duration').value),
            description: document.getElementById('service-desc').value.trim() || null,
            image_url: document.getElementById('service-image').value.trim() || null
        };
        
        try {
            let error;
            
            if (serviceId) {
                // Actualizar existente
                const result = await db.from('services')
                    .update(serviceData)
                    .eq('id', serviceId);
                error = result.error;
            } else {
                // Crear nuevo
                const result = await db.from('services').insert([serviceData]);
                error = result.error;
            }
            
            if (error) throw error;
            
            alert('✅ Servicio guardado correctamente');
            clearServiceForm();
            loadServices();
        } catch (error) {
            console.error('Error guardando servicio:', error);
            alert('❌ Error al guardar: ' + error.message);
        }
    });
    
    btnCancel.addEventListener('click', clearServiceForm);
}

// Editar servicio (función global)
window.editService = async function(id) {
    try {
        const { data, error } = await db.from('services').select('*').eq('id', id).single();
        
        if (error) throw error;
        
        document.getElementById('service-id').value = data.id;
        document.getElementById('service-name').value = data.name;
        document.getElementById('service-price').value = data.price;
        document.getElementById('service-duration').value = data.duration || 30;
        document.getElementById('service-image').value = data.image_url || '';
        document.getElementById('service-desc').value = data.description || '';
        
        document.getElementById('btn-cancel').style.display = 'inline-block';
        document.querySelector('#service-form .btn-primary').textContent = 'Actualizar Servicio';
        
        // Scroll al formulario
        document.getElementById('service-form').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error cargando servicio:', error);
        alert('Error al cargar servicio');
    }
};

// Eliminar servicio (función global)
window.deleteService = async function(id) {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
    
    try {
        const { error } = await db.from('services').delete().eq('id', id);
        
        if (error) throw error;
        
        alert('✅ Servicio eliminado');
        loadServices();
    } catch (error) {
        console.error('Error eliminando servicio:', error);
        alert('❌ Error al eliminar: ' + error.message);
    }
};

// Limpiar formulario de servicio
function clearServiceForm() {
    document.getElementById('service-id').value = '';
    document.getElementById('service-name').value = '';
    document.getElementById('service-price').value = '';
    document.getElementById('service-duration').value = '';
    document.getElementById('service-image').value = '';
    document.getElementById('service-desc').value = '';
    
    document.getElementById('btn-cancel').style.display = 'none';
    document.querySelector('#service-form .btn-primary').textContent = 'Guardar Servicio';
}

// Cargar citas recientes
async function loadAppointments() {
    const container = document.getElementById('appointments-list');
    
    try {
        const { data, error } = await db.from('appointments')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            container.innerHTML = data.map(appointment => `
                <div class="appointment-item">
                    <div class="appointment-header">
                        <strong>${escapeHtml(appointment.customer_name)}</strong>
                        <span class="appointment-status status-${appointment.status}">${appointment.status}</span>
                    </div>
                    <p>${escapeHtml(appointment.service_name)} - ${appointment.service_price} CUP</p>
                    <p class="text-muted">📅 ${appointment.date} ⏰ ${appointment.time}</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted">No hay citas recientes</p>';
        }
    } catch (error) {
        console.error('Error cargando citas:', error);
        container.innerHTML = '<p class="error-msg">Error al cargar citas</p>';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
