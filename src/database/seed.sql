-- ============================================================
-- BRASA POS / PolloPOS · Datos semilla iniciales (Seeds)
-- ============================================================

BEGIN;

-- 1. Sucursal principal
INSERT INTO sucursales (sucursal_id, nombre, direccion, telefono, activa)
VALUES (1, 'Sucursal Centro', 'Av. Principal #123, Zona Central', '+591 70012345', TRUE)
ON CONFLICT (sucursal_id) DO UPDATE 
SET nombre = EXCLUDED.nombre;

SELECT setval('sucursales_sucursal_id_seq', (SELECT MAX(sucursal_id) FROM sucursales));

-- 2. Roles del sistema (RF03, RNF09)
INSERT INTO roles (rol_id, nombre) VALUES 
    (1, 'admin'),
    (2, 'cajero'),
    (3, 'cocina')
ON CONFLICT (rol_id) DO NOTHING;

SELECT setval('roles_rol_id_seq', (SELECT MAX(rol_id) FROM roles));

-- 3. Usuarios de prueba con roles asignados
-- Password hash de 'admin123': $2a$10$wK1Vn53F/J82oM9Ff3qFge9uJ9uY71N6iZ5gG7g2r7A3L1B4V6Qte
-- Hash de PIN '1234': $2a$10$0zHjI21fS9gK34uDqU9eCea2PqmNqj0qgR.W0uY.nI3P0E7Y2Q3bC
-- Password hash de 'cajero123': $2a$10$p0b3c7K2T4vQ2jU6hM8yKe0nO7pI5mS8aC3rD6eF9hJ1kL4oP7qRe
-- Hash de PIN '0231': $2a$10$vN4kY7mP1sT8qW2eR5tYu.0bC2dE4fG6hI8jK0lM2nO4pQ6rS8tUu
-- Password hash de 'cocina123': $2a$10$p0b3c7K2T4vQ2jU6hM8yKe0nO7pI5mS8aC3rD6eF9hJ1kL4oP7qRe
-- Hash de PIN '9999': $2a$10$vN4kY7mP1sT8qW2eR5tYu.0bC2dE4fG6hI8jK0lM2nO4pQ6rS8tUu
INSERT INTO usuarios (usuario_id, sucursal_id, rol_id, nombre_completo, nombre_usuario, password_hash, pin_rapido, correo, telefono, activo)
VALUES 
    (1, 1, 1, 'Administrador General', 'admin', '$2a$10$wK1Vn53F/J82oM9Ff3qFge9uJ9uY71N6iZ5gG7g2r7A3L1B4V6Qte', '$2a$10$0zHjI21fS9gK34uDqU9eCea2PqmNqj0qgR.W0uY.nI3P0E7Y2Q3bC', 'admin@pollopos.com', '70000001', TRUE),
    (2, 1, 2, 'Carlos Méndez (Cajero)', 'carlos.caja1', '$2a$10$p0b3c7K2T4vQ2jU6hM8yKe0nO7pI5mS8aC3rD6eF9hJ1kL4oP7qRe', '$2a$10$vN4kY7mP1sT8qW2eR5tYu.0bC2dE4fG6hI8jK0lM2nO4pQ6rS8tUu', 'carlos@pollopos.com', '70000002', TRUE),
    (3, 1, 3, 'Cocinero de Turno', 'cocina1', '$2a$10$p0b3c7K2T4vQ2jU6hM8yKe0nO7pI5mS8aC3rD6eF9hJ1kL4oP7qRe', '$2a$10$vN4kY7mP1sT8qW2eR5tYu.0bC2dE4fG6hI8jK0lM2nO4pQ6rS8tUu', 'cocina@pollopos.com', '70000003', TRUE)
ON CONFLICT (nombre_usuario) DO NOTHING;

SELECT setval('usuarios_usuario_id_seq', (SELECT MAX(usuario_id) FROM usuarios));

-- 4. Categorías de productos (RF05)
INSERT INTO categorias (categoria_id, nombre, orden) VALUES
    (1, 'Pollo frito', 1),
    (2, 'A la brasa', 2),
    (3, 'Combos', 3),
    (4, 'Acompañamientos', 4),
    (5, 'Bebidas', 5)
ON CONFLICT (categoria_id) DO UPDATE 
SET nombre = EXCLUDED.nombre, orden = EXCLUDED.orden;

SELECT setval('categorias_categoria_id_seq', (SELECT MAX(categoria_id) FROM categorias));

-- 5. Productos iniciales (con URLs de almacenamiento en bucket e icono opcional)
INSERT INTO productos (producto_id, sucursal_id, categoria_id, nombre, descripcion, precio, disponible, imagen_url, imagen_emoji) VALUES
    (1, 1, 1, 'Presa individual', 'Pierna o pechuga', 8.50, TRUE, 'https://storage.googleapis.com/pollopos-bucket/productos/presa_individual.webp', 'drumstick'),
    (2, 1, 1, '1/4 de pollo frito', 'Con papas incluidas', 14.00, TRUE, 'https://storage.googleapis.com/pollopos-bucket/productos/cuarto_pollo_frito.webp', 'drumstick'),
    (3, 1, 2, '1/2 pollo a la brasa', 'Con papas y ensalada', 24.00, TRUE, 'https://storage.googleapis.com/pollopos-bucket/productos/medio_pollo_brasa.webp', 'flame'),
    (4, 1, 3, 'Combo Familiar', 'Pollo entero + 2 gaseosas', 52.00, TRUE, 'https://storage.googleapis.com/pollopos-bucket/productos/combo_familiar.webp', 'package'),
    (5, 1, 5, 'Gaseosa 500ml', 'Varios sabores', 4.00, TRUE, 'https://storage.googleapis.com/pollopos-bucket/productos/gaseosa_500ml.webp', 'cup-soda'),
    (6, 1, 4, 'Papas fritas', 'Porción regular', 6.00, TRUE, 'https://storage.googleapis.com/pollopos-bucket/productos/papas_fritas.webp', 'utensils')
ON CONFLICT (producto_id) DO UPDATE 
SET precio = EXCLUDED.precio, disponible = EXCLUDED.disponible, imagen_url = EXCLUDED.imagen_url;

SELECT setval('productos_producto_id_seq', (SELECT MAX(producto_id) FROM productos));

-- 6. Mesas del local (RF09)
INSERT INTO mesas (sucursal_id, numero) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8)
ON CONFLICT (sucursal_id, numero) DO NOTHING;

-- 7. Descuentos de ejemplo (RF10)
INSERT INTO descuentos (codigo, tipo, valor, activo) VALUES 
    ('PROMO10', 'porcentaje', 10.00, TRUE),
    ('DESC5BS', 'monto_fijo', 5.00, TRUE),
    ('CORTESIA', 'porcentaje', 100.00, TRUE)
ON CONFLICT (codigo) DO NOTHING;

COMMIT;
