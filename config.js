// config.js
// Configuración centralizada de Supabase
const SUPABASE_URL = 'https://jasolzvlclhyjacxmhql.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphc29senZsY2xoeWphY3htaHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDgyMzIsImV4cCI6MjEwNTQ4NDIzMn0._HeZ0jFOw85rN3Dxcnf_VQ6DY3dwon7kbi-xJMhiBX0';

// Inicializar cliente de Supabase
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Función de utilidad para verificar conexión
async function checkConnection() {
    try {
        const { data, error } = await db.from('business_config').select('count').limit(1);
        if (error) throw error;
        console.log('✅ Conexión a Supabase exitosa');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión con Supabase:', error.message);
        console.log('⚠️ Asegúrate de haber ejecutado el script SQL en Supabase y de tener RLS configurado.');
        return false;
    }
}
