// booking.js - Lógica para la página de reservas

let servicesCache = [];
let businessConfig = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadServicesForBooking();
    await loadBusinessConfig();
    setupFormListeners();
    setMinDate();
});

// Cargar servicios en el select
async function loadServicesForBooking() {
    const select = document.getElementById('service');
    
    try {
        const { data, error } = await db.from('services').select('*').order('price', { ascending: true });
        
        if (error) throw error;
        
        servicesCache = data || [];
        
        if (servicesCache.length > 0) {
            select.innerHTML = '<option value="">Selecciona un servicio</option>' +
                servicesCache.map(s => `
                    <option value="${s.id}" 
                            data-price="${s.price}" 
                            data-duration="${s.duration}"
                            data-name="${escapeHtml(s.name)}">
                        ${escapeHtml(s.name)} - ${s.price} CUP (${s.duration} min)
                    </option>
                `).join('');
        } else {
            select.innerHTML = '<option value="">No hay servicios disponibles</option>';
        }
    } catch (error) {
        console.error('Error cargando servicios:', error);
        select.innerHTML = '<option value="">Error al cargar servicios</option>';
    }
}

// Cargar configuración del negocio
async function loadBusinessConfig() {
    try {
        const { data, error } = await db.from('business_config').select('*').single();
        if (!error && data) {
            businessConfig = data;
        }
    } catch (error) {
        console.error('Error cargando config:', error);
    }
}

// Configurar listeners del formulario
function setupFormListeners() {
    const serviceSelect = document.getElementById('service');
    const form = document.getElementById('booking-form');
    
    serviceSelect.addEventListener('change', updateSummary);
    form.addEventListener('submit', handleBooking);
}

// Actualizar resumen de la cita
function updateSummary() {
    const select = document.getElementById('service');
    const option = select.options[select.selectedIndex];
    
    const price = option.getAttribute('data-price') || '-';
    const duration = option.getAttribute('data-duration') || '-';
    const name = option.getAttribute('data-name') || '-';
    
    document.getElementById('summary-service').textContent = name;
    document.getElementById('summary-price').textContent = price;
    document.getElementById('summary-duration').textContent = duration;
}

// Establecer fecha mínima (hoy)
function setMinDate() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Manejar envío del formulario
async function handleBooking(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const serviceSelect = document.getElementById('service');
    const barber = document.getElementById('barber').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const notes = document.getElementById('notes').value.trim();
    
    const option = serviceSelect.options[serviceSelect.selectedIndex];
    const serviceName = option.getAttribute('data-name');
    const price = option.getAttribute('data-price');
    const duration = option.getAttribute('data-duration');
    
    if (!serviceName) {
        alert('Por favor selecciona un servicio');
        return;
    }
    
    // Guardar cita en Supabase
    const appointment = {
        customer_name: name,
        service_name: serviceName,
        service_price: parseInt(price),
        duration: parseInt(duration),
        barber: barber || null,
        date: date,
        time: time,
        notes: notes || null,
        status: 'pending'
    };
    
    try {
        const { error } = await db.from('appointments').insert([appointment]);
        if (error) throw error;
        console.log('✅ Cita guardada en Supabase');
    } catch (error) {
        console.error('Error guardando cita:', error);
        // Continuar aunque falle el guardado (fallback a solo WhatsApp)
    }
    
    // Construir mensaje para WhatsApp
    const phone = businessConfig?.phone || '5351234567';
    const businessName = businessConfig?.business_name || 'Barbería Cuba';
    
    const message = `📅 *Nueva Reserva - ${businessName}*
    
👤 *Nombre:* ${name}
✂️ *Servicio:* ${serviceName}
💰 *Precio:* ${price} CUP
⏱️ *Duración:* ${duration} min
${barber ? `🧔 *Barbero:* ${barber}` : ''}
📆 *Fecha:* ${formatDate(date)}
⏰ *Hora:* ${time}
${notes ? `📝 *Notas:* ${notes}` : ''}

¡Espero confirmación. Gracias!`;
    
    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Resetear formulario
    form.reset();
    updateSummary();
}

// Formatear fecha
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-CU', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
