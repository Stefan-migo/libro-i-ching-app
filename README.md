# I Ching · El libro de los cambios

Aplicación web estática para consultar y estudiar el I Ching, explorar los 64 hexagramas ilustrados y llevar un diario de tiradas en el navegador.

## Ejecutar en local

Desde la raíz del repositorio, ejecuta `python3 -m http.server 8000 --directory dist` y abre `http://localhost:8000`.

La app incluye una guía de monedas y milenrama, lecturas generales y referencias a las ediciones del texto. Los créditos y las fuentes están en la sección «Fuentes y créditos» de la app.

## Configurar las cuentas y el diario sincronizado

1. En el proyecto Supabase, copia **Project URL** y **Publishable key** desde **Connect**. Colócalas en `dist/supabase-config.mjs`. Este archivo se entrega al navegador. Usa solo la clave publicable (`sb_publishable_…`), nunca una clave secreta ni `service_role`.
2. Aplica la migración en `supabase/migrations/`. Si GitHub está conectado, comprueba el directorio del proyecto y activa **Deploy to production** para la rama de producción. Revisa el resultado en el panel de Supabase.
3. En **Authentication → URL Configuration**, añade la URL exacta del frontend a **Redirect URLs** (por ejemplo, `http://localhost:8000/` en local y el origen desplegado en producción). Habilita registro con email y contraseña. Si confirmas los correos, configura el envío de emails para las cuentas a las que vas a dar acceso.
4. Despliega `dist/` en el alojamiento del frontend. La integración de Supabase con GitHub aplica los cambios de Supabase. El sitio de ChatGPT Sites se publica por separado.

La app conserva el modo local cuando faltan la URL o la clave. Con Supabase configurado, cada usuario accede a su diario con su sesión. Desde el diario puede elegir **Importar consultas de este navegador**. La copia conserva las entradas de destino ya existentes. Las políticas RLS impiden acceder a las filas de otras cuentas.

### Comprobación con dos cuentas

Crea dos usuarios distintos y confirma sus correos. Guarda una consulta con la primera cuenta, agrega una relectura, recarga y verifica que se conserve. Cierra la sesión y abre la segunda cuenta. Comprueba que el diario esté vacío y que no aparezca la consulta anterior. Vuelve a la primera cuenta y prueba editar y eliminar una consulta. Prueba importar dos veces las entradas locales y comprueba que no se dupliquen.
