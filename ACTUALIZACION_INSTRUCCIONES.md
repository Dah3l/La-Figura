# 📋 Instrucciones para Actualizar la Base de Datos en Supabase

## ⚠️ IMPORTANTE: Solución al Error "Could not find the 'duration' column"

El error que estabas viendo ocurre porque la tabla `services` en tu base de datos no tiene la columna `duration` definida correctamente o no existe.

### 🔧 Pasos para Solucionar:

1. **Ve a tu panel de Supabase**: https://supabase.com/dashboard

2. **Navega al SQL Editor** en tu proyecto

3. **Copia y ejecuta el siguiente script SQL** (o ejecuta todo el archivo `supabase-schema.sql`):

```sql
-- Verificar y agregar columna duration si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'duration'
    ) THEN
        ALTER TABLE services ADD COLUMN duration INTEGER NOT NULL DEFAULT 30;
    END IF;
END $$;

-- Verificar y agregar columna image_url si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE services ADD COLUMN image_url TEXT;
    END IF;
END $$;
```

4. **Verifica que las columnas existan**:
   - Ve a "Table Editor" → "services"
   - Deberías ver las columnas: `id`, `name`, `price`, `duration`, `description`, `image_url`, `active`, `created_at`, `updated_at`

5. **(Opcional) Inserta servicios con imágenes**:
   ```sql
   INSERT INTO services (name, price, duration, description, image_url) VALUES
   ('Corte Clásico', 500, 30, 'Corte de cabello tradicional con tijera y máquina', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop'),
   ('Corte Moderno', 600, 40, 'Corte de cabello con diseño y estilizado', 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop'),
   ('Barba Completa', 400, 25, 'Perfilado y recorte de barba con toalla caliente', 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=300&fit=crop'),
   ('Corte + Barba', 800, 50, 'Servicio combinado de corte y arreglo de barba', 'https://images.unsplash.com/photo-1503951914875-befbb649186f?w=400&h=300&fit=crop'),
   ('Afeitado Tradicional', 350, 30, 'Afeitado completo con navaja y productos premium', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop'),
   ('Diseño Especial', 200, 15, 'Diseños y figuras personalizadas', 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop'),
   ('Corte Niño', 400, 30, 'Corte especializado para niños', 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=400&h=300&fit=crop'),
   ('Manicure', 300, 20, 'Limpieza y cuidado de uñas', 'https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?w=400&h=300&fit=crop'),
   ('Tratamiento Capilar', 500, 30, 'Hidratación y nutrición del cabello', 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&h=300&fit=crop'),
   ('Servicio VIP', 1500, 90, 'Experiencia completa: corte, barba, manicure y tratamiento', 'https://images.unsplash.com/photo-1593702295094-aea8c5c13589?w=400&h=300&fit=crop')
   ON CONFLICT DO NOTHING;
   ```

---

## 🎨 Cambios Realizados en la Página

### 1. **Solución al Error de Duration**
   - Se agregó valor por defecto (`DEFAULT 30`) a la columna `duration`
   - Se creó script para verificar y agregar la columna si no existe

### 2. **Imágenes en los Servicios** ✨
   - Se agregaron fotos de Unsplash a cada servicio
   - Las imágenes se muestran en las páginas de Inicio y Servicios
   - Lazy loading para mejor rendimiento
   - Manejo elegante si la imagen falla al cargar

### 3. **Eliminación de Barberos en Reservas** 💈
   - Se eliminó el selector de barberos del formulario de reservas
   - Ahora es un solo barbero quien trabaja (como solicitaste)
   - Se simplificó el mensaje de WhatsApp (ya no menciona barbero)

### 4. **Optimización Móvil Mejorada** 📱
   - Navegación más compacta en móviles
   - Hero section reducida para mejor visualización
   - Formularios con inputs de 16px (evita zoom en iOS)
   - Botones de ancho completo en móvil
   - Imágenes de servicios optimizadas (200px en móvil, 250px desktop)
   - Vista de tablet (2 columnas entre 769px-1024px)
   - Panel de admin responsivo

### 5. **Mejoras Visuales**
   - Sombras suaves en imágenes de servicios
   - Bordes redondeados en tarjetas
   - Espaciado consistente en toda la interfaz

---

## 🚀 Cómo Ver los Cambios

1. **Actualiza tu base de datos** siguiendo los pasos anteriores
2. **Recarga la página** (Ctrl+F5 o Cmd+Shift+R)
3. **Prueba en móvil** usando las herramientas de desarrollador de tu navegador

---

## 📁 Archivos Modificados

- `supabase-schema.sql` - Esquema actualizado con imágenes y valores por defecto
- `home.js` - Muestra imágenes en servicios destacados
- `services-page.js` - Muestra imágenes en página de servicios
- `booking.html` - Eliminado selector de barberos
- `booking.js` - Removida lógica de barberos
- `admin.js` - Removida visualización de barberos en citas
- `styles.css` - Optimización móvil completa + estilos para imágenes

---

## ✅ Verificación Final

Después de ejecutar el SQL en Supabase:

1. Ve a la página de **Inicio** → Deberías ver 3 servicios con fotos
2. Ve a **Servicios** → Deberías ver todos los servicios con fotos
3. Ve a **Reservar** → No debería aparecer el selector de barberos
4. Prueba **editar un servicio** en Admin → Debería guardar sin errores

¡Listo! Tu barbería ahora tiene un look más profesional con fotos y está optimizada para móviles. 🎉
