-- ============================================
-- SCRIPT DE CONFIGURACIÓN PARA SUPABASE
-- ============================================
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- 1. Tabla de servicios
CREATE TABLE IF NOT EXISTS services (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    duration INTEGER DEFAULT 30,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de configuración del negocio
CREATE TABLE IF NOT EXISTS business_config (
    id BIGSERIAL PRIMARY KEY,
    whatsapp_number VARCHAR(20) DEFAULT '+5350000000',
    barber_name VARCHAR(255) DEFAULT 'Barbería Cubana',
    address TEXT DEFAULT 'La Habana, Cuba',
    currency VARCHAR(10) DEFAULT 'CUP',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de citas (opcional, para registro)
CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    services JSONB,
    total_price INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insertar datos iniciales de ejemplo
INSERT INTO business_config (whatsapp_number, barber_name, address) 
VALUES ('+5350000000', 'Barbería Cubana', 'La Habana, Cuba')
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (name, price, duration, description, active) VALUES
('Corte Clásico', 150, 30, 'Corte de cabello tradicional con tijera y máquina', true),
('Barba Completa', 100, 20, 'Perfilado y arreglo de barba con toalla caliente', true),
('Corte + Barba', 220, 45, 'Servicio completo: corte de cabello y arreglo de barba', true),
('Afeitado Tradicional', 120, 30, 'Afeitado completo con navaja y toalla caliente', true),
('Corte Niño', 100, 25, 'Corte de cabello para niños', true),
('Peinado Especial', 80, 15, 'Peinado con productos especiales', true);

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de acceso público (para lectura)
-- Servicios: todos pueden leer, solo autenticados pueden modificar
CREATE POLICY "Servicios públicos para lectura" ON services
    FOR SELECT USING (true);

CREATE POLICY "Servicios modificables por autenticados" ON services
    FOR ALL USING (auth.role() = 'authenticated');

-- Business config: todos pueden leer, solo autenticados pueden modificar
CREATE POLICY "Config pública para lectura" ON business_config
    FOR SELECT USING (true);

CREATE POLICY "Config modificable por autenticados" ON business_config
    FOR ALL USING (auth.role() = 'authenticated');

-- Citas: todos pueden insertar, solo autenticados pueden leer/modificar
CREATE POLICY "Citas insertables por todos" ON appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Citas legibles por autenticados" ON appointments
    FOR SELECT USING (auth.role() = 'authenticated');

-- 7. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_config_updated_at
    BEFORE UPDATE ON business_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSTRUCCIONES DESPUÉS DE EJECUTAR ESTE SCRIPT:
-- ============================================
-- 1. Ve a Settings > API en Supabase
-- 2. Copia la URL del proyecto
-- 3. Copia la clave anon/public (no la service_role)
-- 4. Actualiza index.html con esos valores
-- 5. Si quieres autenticación real, configura Email/Password en Authentication > Providers
