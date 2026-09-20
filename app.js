// ============================================
// CONFIGURACIÓN Y ESTADO GLOBAL
// ============================================

// Admin password (en producción, usar autenticación real de Supabase)
const ADMIN_PASSWORD = 'admin123';

// Estado de la aplicación
let services = [];
let barberInfo = {};
let isAdminLoggedIn = false;
let editingServiceId = null;

// ============================================
// FUNCIONES DE SUPABASE
// ============================================

// Obtener servicios desde Supabase
async function fetchServices() {
    try {
        if (!window.sbClient) {
            console.warn('Supabase no está configurado, usando datos locales');
            return null;
        }
        
        const { data, error } = await window.sbClient
            .from('services')
            .select('*')
            .eq('active', true)
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        return null;
    }
}

// Guardar/Actualizar servicio en Supabase
async function saveServiceToSupabase(service) {
    try {
        if (!window.sbClient) return false;
        
        if (service.id && typeof service.id === 'number' && service.id > 0) {
            // Actualizar existente
            const { error } = await window.sbClient
                .from('services')
                .update({
                    name: service.name,
                    price: service.price,
                    duration: service.duration,
                    description: service.description || '',
                    updated_at: new Date().toISOString()
                })
                .eq('id', service.id);
            
            if (error) throw error;
        } else {
            // Crear nuevo
            const { data, error } = await window.sbClient
                .from('services')
                .insert([{
                    name: service.name,
                    price: service.price,
                    duration: service.duration,
                    description: service.description || '',
                    active: true,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        }
        return true;
    } catch (error) {
        console.error('Error al guardar servicio:', error);
        return false;
    }
}

// Eliminar servicio en Supabase (desactivar)
async function deleteServiceFromSupabase(id) {
    try {
        if (!window.sbClient) return false;
        
        const { error } = await window.sbClient
            .from('services')
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq('id', id);
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error al eliminar servicio:', error);
        return false;
    }
}

// Obtener configuración del negocio
async function fetchBusinessConfig() {
    try {
        if (!window.sbClient) return null;
        
        const { data, error } = await window.sbClient
            .from('business_config')
            .select('*')
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        return null;
    }
}

// Guardar configuración del negocio
async function saveBusinessConfig(config) {
    try {
        if (!window.sbClient) return false;
        
        const existing = await fetchBusinessConfig();
        
        if (existing && existing.id) {
            // Actualizar existente
            const { error } = await window.sbClient
                .from('business_config')
                .update({
                    whatsapp_number: config.whatsappNumber,
                    barber_name: config.barberName,
                    address: config.address,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            
            if (error) throw error;
        } else {
            // Crear nuevo
            const { error } = await window.sbClient
                .from('business_config')
                .insert([{
                    whatsapp_number: config.whatsappNumber,
                    barber_name: config.barberName,
                    address: config.address
                }]);
            
            if (error) throw error;
        }
        return true;
    } catch (error) {
        console.error('Error al guardar configuración:', error);
        return false;
    }
}

// Guardar cita en Supabase
async function saveAppointment(appointment) {
    try {
        if (!window.sbClient) return false;
        
        const { data, error } = await window.sbClient
            .from('appointments')
            .insert([{
                customer_name: appointment.customerName,
                customer_phone: appointment.customerPhone,
                appointment_date: appointment.date,
                appointment_time: appointment.time,
                services: JSON.stringify(appointment.services),
                total_price: appointment.totalPrice,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error al guardar cita:', error);
        return false;
    }
}

// ============================================
// DATOS POR DEFECTO (FALLBACK)
// ============================================

const defaultServices = [
    { id: 1, name: 'Corte Clásico', price: 150, duration: 30, icon: '✂️' },
    { id: 2, name: 'Corte Moderno', price: 200, duration: 40, icon: '🎨' },
    { id: 3, name: 'Afeitado Tradicional', price: 100, duration: 20, icon: '🪒' },
    { id: 4, name: 'Barba Completa', price: 120, duration: 25, icon: '🧔' },
    { id: 5, name: 'Corte + Barba', price: 250, duration: 50, icon: '💯' },
    { id: 6, name: 'Peinado', price: 80, duration: 15, icon: '💈' }
];

const defaultBarberInfo = {
    whatsappNumber: '+5355555555',
    barberName: 'Barbería Cubana',
    address: 'La Habana, Cuba'
};

// ============================================
// FUNCIONES DE LOCALSTORAGE (FALLBACK)
// ============================================

function loadServicesFromLocal() {
    const saved = localStorage.getItem('barberServices');
    return saved ? JSON.parse(saved) : [...defaultServices];
}

function saveServicesToLocal() {
    localStorage.setItem('barberServices', JSON.stringify(services));
}

function loadBarberInfoFromLocal() {
    const saved = localStorage.getItem('barberInfo');
    return saved ? JSON.parse(saved) : { ...defaultBarberInfo };
}

function saveBarberInfoToLocal() {
    localStorage.setItem('barberInfo', JSON.stringify(barberInfo));
}

// ============================================
// INICIALIZACIÓN Y CARGA DE DATOS
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    renderServices();
    renderBookingServices();
    setupEventListeners();
    setMinDate();
});

// Cargar datos (primero intenta Supabase, luego localStorage)
async function loadData() {
    // Intentar cargar servicios desde Supabase
    const supabaseServices = await fetchServices();
    if (supabaseServices && supabaseServices.length > 0) {
        services = supabaseServices.map(s => ({
            id: s.id,
            name: s.name,
            price: s.price,
            duration: s.duration,
            icon: s.icon || '✂️'
        }));
    } else {
        services = loadServicesFromLocal();
    }
    
    // Intentar cargar configuración desde Supabase
    const supabaseConfig = await fetchBusinessConfig();
    if (supabaseConfig) {
        barberInfo = {
            whatsappNumber: supabaseConfig.whatsapp_number || defaultBarberInfo.whatsappNumber,
            barberName: supabaseConfig.barber_name || defaultBarberInfo.barberName,
            address: supabaseConfig.address || defaultBarberInfo.address
        };
    } else {
        barberInfo = loadBarberInfoFromLocal();
    }
    
    // Poblar formulario de información
    document.getElementById('whatsappNumber').value = barberInfo.whatsappNumber;
    document.getElementById('barberName').value = barberInfo.barberName;
    document.getElementById('barberAddress').value = barberInfo.address;
    
    // Actualizar logo con nombre real
    document.querySelector('.logo h1').textContent = `✂️ ${barberInfo.barberName}`;
}

// Render services on the main page
function renderServices() {
    const container = document.getElementById('servicesContainer');
    container.innerHTML = '';

    services.forEach(service => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <div class="service-icon">${service.icon || '✂️'}</div>
            <h3>${service.name}</h3>
            <div class="price">$${service.price} CUP</div>
            <div class="duration">${service.duration} minutos</div>
        `;
        container.appendChild(card);
    });
}

// Render services checkboxes in booking form
function renderBookingServices() {
    const container = document.getElementById('bookingServices');
    container.innerHTML = '';

    services.forEach(service => {
        const item = document.createElement('div');
        item.className = 'service-checkbox-item';
        item.innerHTML = `
            <input type="checkbox" id="service_${service.id}" value="${service.id}" data-price="${service.price}">
            <label for="service_${service.id}">${service.name} - $${service.price} CUP</label>
        `;
        container.appendChild(item);
    });

    // Add event listeners to checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateTotalPrice);
    });
}

// Update total price when services are selected
function updateTotalPrice() {
    let total = 0;
    document.querySelectorAll('#bookingServices input[type="checkbox"]:checked').forEach(checkbox => {
        total += parseFloat(checkbox.dataset.price);
    });
    document.getElementById('totalPrice').textContent = `$${total} CUP`;
}

// Set minimum date to today
function setMinDate() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Setup Event Listeners
function setupEventListeners() {
    // Booking form submission
    document.getElementById('bookingForm').addEventListener('submit', handleBooking);

    // Admin login
    document.getElementById('loginForm').addEventListener('submit', handleAdminLogin);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Service form submission
    document.getElementById('serviceForm').addEventListener('submit', handleServiceSubmit);

    // Cancel edit
    document.getElementById('cancelEdit').addEventListener('click', cancelEdit);

    // Barber info form
    document.getElementById('barberInfoForm').addEventListener('submit', handleBarberInfoSubmit);

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Handle booking form submission
async function handleBooking(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;

    // Get selected services
    const selectedServices = [];
    let total = 0;
    document.querySelectorAll('#bookingServices input[type="checkbox"]:checked').forEach(checkbox => {
        const service = services.find(s => s.id == checkbox.value);
        if (service) {
            selectedServices.push(service.name);
            total += service.price;
        }
    });

    if (selectedServices.length === 0) {
        alert('Por favor, selecciona al menos un servicio.');
        return;
    }

    // Format date for display
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // Guardar cita en Supabase (opcional)
    const appointmentData = {
        customerName: name,
        customerPhone: phone,
        date: date,
        time: time,
        services: selectedServices,
        totalPrice: total
    };
    
    await saveAppointment(appointmentData);

    // Create WhatsApp message
    const message = `👋 Hola, quiero reservar una cita:%0A%0A` +
                    `👤 *Nombre:* ${name}%0A` +
                    `📞 *Teléfono:* ${phone}%0A` +
                    `📅 *Fecha:* ${formattedDate}%0A` +
                    `⏰ *Hora:* ${time}%0A` +
                    `✂️ *Servicios:* ${selectedServices.join(', ')}%0A` +
                    `💰 *Total:* $${total} CUP%0A%0A` +
                    `¡Espero confirmación. Gracias!`;

    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${barberInfo.whatsappNumber.replace('+', '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
}

// Handle admin login
function handleAdminLogin(e) {
    e.preventDefault();

    const password = document.getElementById('adminPassword').value;

    if (password === ADMIN_PASSWORD) {
        isAdminLoggedIn = true;
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        renderAdminServices();
        
        // Clear password field
        document.getElementById('adminPassword').value = '';
    } else {
        alert('Contraseña incorrecta. Por favor intenta de nuevo.');
    }
}

// Handle logout
function handleLogout() {
    isAdminLoggedIn = false;
    editingServiceId = null;
    document.getElementById('loginPanel').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('serviceForm').reset();
    document.getElementById('cancelEdit').style.display = 'none';
}

// Render admin services table
function renderAdminServices() {
    const tbody = document.getElementById('adminServicesList');
    tbody.innerHTML = '';

    services.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${service.icon || '✂️'} ${service.name}</td>
            <td>$${service.price} CUP</td>
            <td>${service.duration} min</td>
            <td>
                <button class="action-btn btn-edit" onclick="editService(${service.id})">Editar</button>
                <button class="action-btn btn-delete" onclick="deleteService(${service.id})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Edit service
window.editService = function(id) {
    const service = services.find(s => s.id === id);
    if (service) {
        editingServiceId = id;
        document.getElementById('serviceId').value = service.id;
        document.getElementById('serviceName').value = service.name;
        document.getElementById('servicePrice').value = service.price;
        document.getElementById('serviceDuration').value = service.duration;
        
        document.getElementById('cancelEdit').style.display = 'inline-block';
        document.querySelector('.service-form button[type="submit"]').textContent = 'Actualizar Servicio';
        
        // Scroll to form
        document.getElementById('serviceForm').scrollIntoView({ behavior: 'smooth' });
    }
};

// Delete service
window.deleteService = async function(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
        // Intentar eliminar en Supabase primero
        const deletedInSupabase = await deleteServiceFromSupabase(id);
        
        if (deletedInSupabase) {
            // Eliminar del array local
            services = services.filter(s => s.id !== id);
        } else {
            // Fallback: solo eliminar localmente
            services = services.filter(s => s.id !== id);
        }
        
        saveServicesToLocal();
        renderAdminServices();
        renderServices();
        renderBookingServices();
    }
};

// Handle service form submission
async function handleServiceSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('serviceName').value.trim();
    const price = parseFloat(document.getElementById('servicePrice').value);
    const duration = parseInt(document.getElementById('serviceDuration').value) || 30;

    if (editingServiceId) {
        // Update existing service
        const serviceIndex = services.findIndex(s => s.id === editingServiceId);
        if (serviceIndex !== -1) {
            services[serviceIndex] = {
                ...services[serviceIndex],
                name,
                price,
                duration
            };
            
            // Guardar en Supabase si está disponible
            await saveServiceToSupabase(services[serviceIndex]);
        }
        editingServiceId = null;
        document.getElementById('cancelEdit').style.display = 'none';
        document.querySelector('.service-form button[type="submit"]').textContent = 'Guardar Servicio';
    } else {
        // Add new service
        const icons = ['✂️', '🎨', '🪒', '🧔', '💯', '💈', '👨‍🦱', '✨'];
        const newService = {
            id: Date.now(),
            name,
            price,
            duration,
            icon: icons[Math.floor(Math.random() * icons.length)]
        };
        services.push(newService);
        
        // Intentar guardar en Supabase y obtener ID real
        const savedService = await saveServiceToSupabase(newService);
        if (savedService && savedService.id) {
            // Actualizar con el ID real de la base de datos
            newService.id = savedService.id;
            services[services.length - 1] = newService;
        }
    }

    // Guardar en localStorage como fallback
    saveServicesToLocal();
    renderAdminServices();
    renderServices();
    renderBookingServices();
    
    document.getElementById('serviceForm').reset();
    alert('Servicio guardado exitosamente.');
}

// Cancel edit
function cancelEdit() {
    editingServiceId = null;
    document.getElementById('serviceForm').reset();
    document.getElementById('cancelEdit').style.display = 'none';
    document.querySelector('.service-form button[type="submit"]').textContent = 'Guardar Servicio';
}

// Handle barber info submission
async function handleBarberInfoSubmit(e) {
    e.preventDefault();

    barberInfo.whatsappNumber = document.getElementById('whatsappNumber').value.trim();
    barberInfo.barberName = document.getElementById('barberName').value.trim();
    barberInfo.address = document.getElementById('barberAddress').value.trim();

    // Guardar en Supabase
    const savedInSupabase = await saveBusinessConfig(barberInfo);
    
    if (!savedInSupabase) {
        // Fallback a localStorage
        saveBarberInfoToLocal();
    }
    
    // Update logo if barber name changed
    document.querySelector('.logo h1').textContent = `✂️ ${barberInfo.barberName}`;
    
    alert('Información actualizada exitosamente.');
}

// Make functions globally available
window.renderAdminServices = renderAdminServices;
