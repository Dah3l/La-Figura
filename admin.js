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

// Cargar servicios en el panel (solo activos)
async function loadServices() {
    const container = document.getElementById('admin-services-list');
    
    try {
        // Obtener todos los servicios y filtrar solo activos en JS para evitar errores de columna
        const { data: allData, error } = await db.from('services').select('*');
        
        if (error) throw error;
        
        // Filtrar solo activos y ordenar por position
        const data = (allData || [])
            .filter(s => s.is_active !== false)
            .sort((a, b) => {
                const posA = a.position !== null ? a.position : 999999;
                const posB = b.position !== null ? b.position : 999999;
                return posA - posB;
            });
        
        if (data && data.length > 0) {
            container.innerHTML = data.map((service, index) => `
                <div class="service-item" data-id="${service.id}">
                    <div class="service-info">
                        <strong>${escapeHtml(service.name)}</strong>
                        <span>${service.price} CUP | ${service.duration || 30} min</span>
                        ${service.description ? `<small>${escapeHtml(service.description)}</small>` : ''}
                    </div>
                    <div class="service-actions">
                        <button class="btn btn-sm btn-outline" onclick="moveServiceToStart(${service.id})" title="Mover al inicio">⏮️</button>
                        <button class="btn btn-sm btn-outline" onclick="moveService(${service.id}, ${index - 1})" ${index === 0 ? 'disabled' : ''} title="Mover arriba">⬆️</button>
                        <button class="btn btn-sm btn-outline" onclick="moveService(${service.id}, ${index + 1})" ${index === data.length - 1 ? 'disabled' : ''} title="Mover abajo">⬇️</button>
                        <button class="btn btn-sm btn-outline" onclick="moveServiceToEnd(${service.id})" title="Mover al final">⏭️</button>
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
        container.innerHTML = '<p class="error-msg">Error al cargar servicios: ' + error.message + '</p>';
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

// Mover servicio arriba/abajo (función global) - Optimizado: solo actualiza position
window.moveService = async function(id, newIndex) {
    try {
        // Obtener todos los servicios activos
        const { data: allServices, error: fetchError } = await db.from('services').select('*');
        if (fetchError) throw fetchError;
        
        const activeServices = allServices.filter(s => s.is_active !== false);
        
        // Verificar límites
        if (newIndex < 0 || newIndex >= activeServices.length) return;
        
        // Obtener servicio actual y el de destino
        const currentService = activeServices.find(s => s.id === id);
        const targetService = activeServices[newIndex];
        
        if (!currentService || !targetService) return;
        if (currentService.id === targetService.id) return;
        
        // Calcular posiciones
        const getPosition = (service) => {
            if (service.position !== null && service.position !== undefined) {
                return service.position;
            }
            const idx = activeServices.findIndex(s => s.id === service.id);
            return idx * 1000 + service.price;
        };
        
        const currentPos = getPosition(currentService);
        const targetPos = getPosition(targetService);
        
        // Actualizar SOLO el campo position de ambos servicios
        const { error: updateError } = await db.from('services')
            .update({ position: targetPos })
            .eq('id', currentService.id);
        
        if (updateError) throw updateError;
        
        const { error: updateError2 } = await db.from('services')
            .update({ position: currentPos })
            .eq('id', targetService.id);
        
        if (updateError2) throw updateError2;
        
        loadServices();
    } catch (error) {
        console.error('Error moviendo servicio:', error);
        alert('⚠️ Error al mover: ' + error.message);
    }
};

// Mover servicio al inicio (función global) - Optimizado: solo actualiza position
window.moveServiceToStart = async function(id) {
    try {
        // Obtener todos los servicios activos
        const { data: allServices, error: fetchError } = await db.from('services').select('*');
        if (fetchError) throw fetchError;
        
        const activeServices = allServices.filter(s => s.is_active !== false);
        if (activeServices.length <= 1) return;
        
        // Si ya está al inicio, no hacer nada
        if (activeServices[0].id === id) return;
        
        // Encontrar la posición mínima actual de los que tienen position
        const positionsWithValues = activeServices
            .filter(s => s.position !== null && s.position !== undefined)
            .map(s => s.position);
        
        let newPosition;
        if (positionsWithValues.length > 0) {
            newPosition = Math.min(...positionsWithValues) - 1;
        } else {
            newPosition = 0;
        }
        
        // Actualizar SOLO el campo position
        const { error: updateError } = await db.from('services')
            .update({ position: newPosition })
            .eq('id', id);
        
        if (updateError) throw updateError;
        
        loadServices();
    } catch (error) {
        console.error('Error moviendo servicio al inicio:', error);
        alert('⚠️ Error al mover: ' + error.message);
    }
};

// Mover servicio al final (función global)
window.moveServiceToEnd = async function(id) {
    try {
        // Obtener todos los servicios activos
        const { data: allServices, error: fetchError } = await db.from('services').select('*');
        if (fetchError) throw fetchError;
        
        const activeServices = allServices.filter(s => s.is_active !== false);
        if (activeServices.length <= 1) return;
        
        // Si ya está al final, no hacer nada
        if (activeServices[activeServices.length - 1].id === id) return;
        
        // Encontrar la posición máxima actual de los que tienen position
        const positionsWithValues = activeServices
            .filter(s => s.position !== null && s.position !== undefined)
            .map(s => s.position);
        
        let newPosition;
        if (positionsWithValues.length > 0) {
            newPosition = Math.max(...positionsWithValues) + 1;
        } else {
            newPosition = activeServices.length;
        }

        // Actualizar SOLO el campo position
        const { error: updateError } = await db.from('services')
            .update({ position: newPosition })
            .eq('id', id);

        if (updateError) throw updateError;

        loadServices();
    } catch (error) {
        console.error('Error moviendo servicio al final:', error);
        alert('⚠️ Error al mover: ' + error.message);
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
