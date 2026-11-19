# AccessMap — Especificación de producto y desarrollo (Cursor)

> **Estado:** documento de trabajo inicial · **Versión:** 0.2 · **Fecha:** 2026-11-19  
> **Nombre provisional:** AccessMap (comprobar marca antes de comercializar).  
> **i18n:** inglés (default) y español · `@nuxtjs/i18n` con `strategy: 'no_prefix'` (locale en cookie; sin `/es` en la URL).  
> **Stack fijado:** Nuxt 4, PostgreSQL, Drizzle (`pg`), bun, Docker Compose (dev/prod).  
> **Mercado inicial:** desarrolladores individuales, freelancers y pequeños equipos; después agencias digitales.  
> **Objetivo de este documento:** ser la fuente de verdad para diseñar y desarrollar el MVP en Cursor. No interpretar los ejemplos como información de infraestructura verificada.  
> **Roadmap detallado:** [docs/ROADMAP.md](ROADMAP.md).

---

## 0. Instrucciones para Cursor / agente de desarrollo

Este documento define **qué** construir, **cómo** modelarlo y **cómo validar** que funciona. No implementes todo de golpe.

**Forma de trabajo obligatoria:**

1. Lee este documento completo y propone primero estructura del repositorio, esquema de base de datos y un plan incremental en PRs/tareas.
2. Implementa solo la **Fase 0** y la **Fase 1** hasta que se solicite avanzar. Prioriza un vertical slice funcionando de extremo a extremo sobre pantallas de demostración.
3. Usa migraciones de base de datos, datos de ejemplo reproducibles, tests y validaciones. Nada de datos hardcodeados que aparenten proceder de APIs externas.
4. No desarrolles un gestor de contraseñas, un motor de ejecución remota ni una plataforma de monitorización.
5. No inventes APIs, endpoints, scopes OAuth, permisos o compatibilidades. Para cualquier integración comprueba la documentación oficial actual antes de codificarla.
6. Si una operación puede afectar a producción (DNS, permisos, credenciales, CI/CD, servidores, facturación), el MVP **solo genera un plan**. Nunca la ejecuta automáticamente.
7. Distingue los datos **declarados** de los **verificados**. Un formulario completado no equivale a una comprobación real del proveedor.
8. Mantén el código modular, tipos estrictos, pruebas de aislamiento multi-tenant y un diseño responsive y accesible.
9. Mantén una checklist de tareas y decisiones técnicas pendientes. Si una ambigüedad no bloquea, elige la implementación más sencilla y anota la decisión.
10. No solicitar ni almacenar claves, tokens, passwords, códigos 2FA, claves SSH privadas, cookies de sesión, códigos EPP, secretos OAuth ni archivos `.env` reales.

**Primera tarea concreta para Cursor:** implementar Fase 0 y Fase 1 según [docs/ROADMAP.md](ROADMAP.md): Nuxt 4 + PostgreSQL + **migraciones Drizzle**, autenticación con **sesiones propias** (sin Better Auth ni Auth Utils), workspace personal automático, i18n `en`/`es` sin prefix en rutas, UI con Tailwind + Reka UI e iconos propios (sin Nuxt UI). Incluir seed ficticio de Mini Críptico. **No** integraciones externas en este tramo. El signup solo está abierto mientras no exista ningún usuario; el primero es owner.

**Criterio de primer dogfood:** inventario + wizard + CSV (Fase 1); responder la sección 4.4. Runbooks y planes de migración (sección 26 parcial) corresponden a Fase 2 y 3.

---

## 1. Visión

**AccessMap es el mapa de control y configuración de todos los recursos digitales de una persona, proyecto, equipo o agencia.**

Una persona puede tener cuatro correos, dos servidores, múltiples cuentas de Google, herramientas de contenido, repositorios, un servicio de correo transaccional, un registrador y decenas de configuraciones. AccessMap responde:

- **Qué existe** y para qué se usa.
- **Dónde se administra** cada cosa (enlace a consola, repositorio o documentación).
- **Con qué identidad/cuenta se accede** y quién administra o es propietario del recurso.
- **Cómo está conectado** con el resto de su infraestructura.
- **Dónde están sus secretos**, por referencia a Bitwarden/1Password u otro vault, sin copiarlos.
- **Cómo configurar todo de nuevo**, mediante guías reproducibles estilo README y checklists.
- **Cómo cambiar de proveedor, persona o cuenta**, mediante planes de migración con dependencias, verificaciones y rollback.
- **Qué falta documentar, verificar o reasignar**.

**Posicionamiento:** *«Toda tu infraestructura digital explicada, conectada y lista para reconstruir o transferir. Sin guardar contraseñas».*

No es un password manager, no es un CMDB empresarial completo, no sustituye Terraform ni Ansible, no es un proveedor cloud y no ejecuta migraciones automáticamente en el MVP.

### Hipótesis de producto

El problema inicial no es la falta de capacidad técnica del usuario, sino la dispersión de decisiones y relaciones entre servicios. Una persona sabe que tiene GitHub, AWS y Google, pero puede olvidar **qué cuenta controla qué recurso**, qué variable consume qué servicio o qué debe modificar antes de una migración.

**La principal ventaja competitiva a validar** es unir inventario estructurado + mapa de identidades + dependencias + guías de setup + planes de cambio en una experiencia muy rápida. Existe competencia parcial en documentación IT, password managers, wikis y herramientas de onboarding; no asumir que el segmento está vacío.

---

## 2. Personas y evolución de mercado

### Persona A — Desarrollador / creador individual (PRIMERA PRIORIDAD)

Ejemplo: mantiene un proyecto online con múltiples herramientas, correos, repositorios y servidores. Necesita recordar configuraciones, preparar un nuevo entorno, delegar trabajo o migrar servicios.

**Trabajo principal:** «Quiero poder abrir mi proyecto y entender todo en pocos minutos, incluso dentro de seis meses».

**Éxito:** inventariar Mini Críptico, detectar cuentas y dependencias, generar un README de incorporación y planificar una migración de prueba.

### Persona B — Freelancer con varios proyectos

Gestiona 5–20 proyectos propios o de clientes. Necesita cambiar entre ellos sin mezclar cuentas ni credenciales.

**Trabajo principal:** «No quiero confundir el hosting o la cuenta de Google de un cliente con los de otro».

### Persona C — Equipo pequeño

Un equipo de 2–15 personas incorpora colaboradores, reasigna responsabilidades y desea documentación reproducible.

**Trabajo principal:** «Si alguien nuevo entra el lunes, quiero darle una guía fiable sobre qué solicitar, qué configurar y cómo verificarlo».

### Persona D — Agencia digital (SEGUNDA ETAPA)

Múltiples empleados, cientos o miles de clientes y recursos, separación de permisos, revisiones, offboarding, paquetes de entrega e importaciones masivas.

**Trabajo principal:** «Necesito una fuente de verdad por cliente y poder controlar lo que cambia cuando entra o sale una persona».

**Principio de diseño:** empezar con una persona, pero usar desde el día uno un **workspace** que pueda ser personal o de equipo. No codificar reglas suponiendo que hay siempre un único usuario o un único proyecto.

---

## 3. Términos y modelo mental (esenciales)

Estos conceptos **no son sinónimos**:

| Entidad | Qué representa | Ejemplo |
| --- | --- | --- |
| **Workspace** | Espacio aislado de una persona/equipo/agencia | «Mis proyectos», «Agencia Lima» |
| **Client / Cliente** | Empresa para la que trabaja una agencia; no es obligatorio en personal | Clínica Norte |
| **Project / Proyecto** | Producto, web o iniciativa que agrupa recursos | Mini Críptico |
| **Provider / Proveedor** | Marca o servicio genérico del catálogo | Google, GitHub, AWS, Namecheap |
| **Provider account / Cuenta de proveedor** | Instancia/cuenta concreta desde la que se administra algo | Cuenta Google A, AWS account 123… (enmascarado) |
| **Identity / Identidad** | Cuenta de inicio de sesión o principal de autenticación | Google personal A, Google trabajo B, usuario GitHub |
| **Email address / Dirección** | Dirección usada para entrar, recibir avisos o recuperar cuentas | `dev@example.com`, `alerts@example.com` |
| **Asset / Recurso** | Elemento real controlado o administrado | canal YouTube, propiedad Search Console, VPS-01 |
| **Environment / Entorno** | Contexto técnico de un proyecto | development, staging, production |
| **Config entry / Configuración** | Dato descriptivo no secreto o referencia a una variable | nombre de variable `GOOGLE_CLIENT_ID`, no su valor sensible |
| **Role / Asignación** | Relación entre identidad/persona/cuenta y un recurso | Cuenta Google B tiene rol admin del canal |
| **Dependency / Dependencia** | Un activo necesita, utiliza o administra otro | OAuth de la web depende de un cliente OAuth en Google Cloud |
| **Vault reference / Referencia segura** | Puntero descriptivo a un secreto en un gestor externo | «Bitwarden > Mini Críptico > Google OAuth (prod)» |
| **Runbook** | Guía reproducible de setup, recuperación o incorporación | «Preparar nuevo desarrollador» |
| **Migration plan** | Plan para pasar del estado actual a otro | GitHub → Bitbucket |
| **Verification / Verificación** | Evidencia de que una afirmación o paso fue comprobado | «Validado manualmente el 19/11/2026» |

### Reglas de dominio

- Una **identidad** puede usar una dirección de correo, pero **no es simplemente el correo**. Google Account A y Google Account B son dos identidades distintas aunque una dirección pueda actuar como correo de recuperación de otra.
- Una **dirección** puede ser login, recuperación, notificaciones, facturación, soporte o alias; marcar uno o varios usos.
- Una **cuenta de proveedor** puede contener muchos recursos. Ej.: una cuenta Google puede dar acceso a Cloud project, Search Console, Ads y YouTube, pero cada producto tiene su propio modelo de permisos.
- **Tener acceso no equivale a ser propietario**, pagar tampoco equivale a administrar.
- Un **activo puede usarse en varios proyectos**; no duplicar automáticamente el activo. Ej.: una cuenta AWS y su SES pueden dar servicio a dos proyectos. Modelarlo como asociación muchos-a-muchos.
- El mismo proveedor puede tener **múltiples cuentas** y **múltiples identidades de acceso**.
- «Cloudflare» no es un activo suficiente: distinguir cuenta, zona DNS, bucket/almacenamiento, worker y otros recursos según proceda.
- **No inferir** relaciones a partir del mismo email, mismo dominio o nombre parecido. Sugerir una posible relación y pedir confirmación.
- Distinguir `source=manual|import|integration`, `verification_status=unverified|declared|confirmed_by_human|verified_by_integration`, `verified_at` y `verified_by`.

---

## 4. Primer caso de uso: Mini Críptico (dogfooding)

> **Importante:** este apartado refleja lo que el usuario ha descrito, **no** un inventario comprobado de credenciales o infraestructura. Los correos reales, IDs, URLs de administración, proveedores concretos y dependencias se deben completar durante el onboarding. Los nombres A/B/C/D son identificadores de ejemplo.

### 4.1 Proyectos y entorno

- Workspace personal: «Personal».
- Proyecto: **Mini Críptico** (`minicriptico.com`).
- Entornos iniciales: `production` y `development`; `staging` opcional, no asumir que existe.
- Persona principal: único mantenedor actualmente.
- Cuatro direcciones de email distintas que intervienen en diversas herramientas (nombres y roles por completar).

### 4.2 Inventario inicial orientativo

| Proveedor | Recurso / cuenta por registrar | Identidad y relación pendiente de confirmar | Relaciones a explorar |
| --- | --- | --- | --- |
| Google | Cuenta Google A | `Google A`; correo real por introducir | ¿Qué servicios dependen de esta cuenta? |
| Google | Cuenta Google B | `Google B`; correo real por introducir | ¿Qué servicios dependen de esta otra cuenta? |
| Google Cloud | Proyecto y cliente OAuth para «Iniciar sesión con Google» | ¿A o B? ¿otros administradores? | OAuth client ID, URIs de callback, consentimiento, APIs, entorno y vault externo |
| YouTube | Canal de Mini Críptico | ¿A o B? ¿Brand Account/permisos de canal? | Publicación de Shorts, responsables, recuperación |
| Google Ads | Cuenta publicitaria | ¿A o B? ¿cuenta directa o manager? | Accesos, facturación, conversiones, web |
| Google Search Console | Propiedad de `minicriptico.com` | ¿A o B? ¿owner verificado/delegado? | Dominio, DNS, métodos de verificación |
| Google AdSense | **Opcional: confirmar si se quiere inventariar** | ¿Con qué cuenta? | Sitio, propiedad y facturación publicitaria |
| Instagram / Meta | Perfil y posibles herramientas Meta | Identidad/login pendientes | Contenido, publicaciones, automatizaciones autorizadas |
| TikTok | Perfil de creador | Identidad/login pendientes | Publicación, enlaces y dependencias |
| Namecheap | Dominio y cuenta del registrador | Email/identidad pendientes | Registrador, renovación, contactos, DNS (verificar quién lo opera) |
| OpenShip | Servicio/servidor de correo | Cuenta y panel pendientes | MX, buzones, SMTP/IMAP y copias (verificar arquitectura) |
| VPS proveedor por confirmar | VPS-01 (función por documentar) | Cuenta de hosting + identidad SSH | IP/hostname, despliegues, acceso, backup, firewall |
| VPS proveedor por confirmar | VPS-02 (función por documentar) | Cuenta de hosting + identidad SSH | Función diferente, accesos, servicios, backup |
| GitHub | Repositorio 1 (nombre por completar) | Identidad GitHub, organización o cuenta | Código, pipelines, deploy keys, environments, webhooks |
| GitHub | Repositorio 2 (nombre por completar) | Igual o diferente | Relación con proyecto y servidor |
| Cloudflare | Storage de imágenes (producto exacto por confirmar) | Cuenta y administradores | Bucket/servicio, dominio/CDN, permisos, costes |
| AWS | Cuenta AWS y configuración SES | Identidad/login/roles por confirmar | Dominio verificado, región, DNS, credenciales en vault, envío |
| Bitwarden | Vault externo | Identidad de acceso propia | Solo **referencias** a ítems, jamás secretos |
| Otros | Servicios adicionales | Por descubrir | Añadidos gradualmente en onboarding |

### 4.3 Las cuatro direcciones de correo

Crear cuatro registros `email_addresses` inicialmente identificados como:

- **Email A** — nombre real pendiente; posibles funciones: login, recuperación, avisos.
- **Email B** — nombre real pendiente; posibles funciones: login, facturación, administración.
- **Email C** — nombre real pendiente; posibles funciones: correo de proyecto o soporte.
- **Email D** — nombre real pendiente; posibles funciones: infraestructura y alertas.

Son **etiquetas**, no atribuciones reales. El onboarding debe preguntar qué hace cada correo y qué cuentas usan cada uno. No deducir por defecto que las cuatro direcciones son cuatro Google Accounts, ni que el correo con el que se inicia sesión es el propietario de todos los productos de Google.

### 4.4 Preguntas que AccessMap debe contestar en este caso

1. ¿Qué servicios de Mini Críptico se administran con la **Cuenta Google A** y cuáles con la **B**?
2. Si mañana pierdo acceso al Email A, ¿qué recursos y procesos de recuperación quedan afectados?
3. ¿Dónde se configura el OAuth de Google? ¿Qué Google Cloud project, OAuth client, callback URLs y entorno están asociados?
4. ¿Qué canal YouTube pertenece al proyecto y qué cuentas tienen permisos reales sobre él?
5. ¿Dónde se verifica `minicriptico.com` en Search Console y qué método de propiedad se usa?
6. ¿Cuáles son las dependencias entre registrador, DNS, servicio de correo y AWS SES? Diferenciar **correo de buzón** de **correo transaccional**.
7. ¿En qué VPS se ejecuta cada servicio? ¿Qué repo despliega dónde? ¿Dónde se guarda la referencia a las claves SSH?
8. ¿Dónde está configurado el almacenamiento de imágenes y qué aplicación lo consume?
9. ¿Cómo prepararía a otro programador para trabajar sin compartir mis contraseñas ni concederle accesos excesivos?
10. ¿Qué tendría que modificar antes de migrar GitHub a Bitbucket, el dominio de Namecheap a Hostinger, un VPS, o el proyecto OAuth a otra cuenta responsable?

### 4.5 Resultado mínimo de dogfooding

- Crear el workspace y **1 proyecto real**.
- Registrar **4 emails, 2 identidades Google (si efectivamente son dos), 2 VPS, 2 repositorios** y el resto de cuentas/activos relevantes.
- Identificar **al menos 10 relaciones** entre activos/identidades/configuraciones (con confirmación del usuario).
- Consultar «impacto de perder Cuenta Google A» y «todo lo que depende de VPS-01».
- Generar **un README de incorporación** usando el inventario.
- Generar **un plan de migración GitHub → Bitbucket** y **otro para registrador Namecheap → Hostinger** sin hacer cambios reales.
- Completar el producto sin introducir ninguna contraseña, token privado ni secreto en AccessMap.

---

## 5. Navegación e interfaz

### Navegación principal (MVP)

1. **Inicio**: resumen del workspace, proyectos, activos, vínculos sin confirmar, documentación pendiente.
2. **Proyectos**: listado y ficha de proyecto.
3. **Cuentas e identidades**: quién entra dónde, con qué correo y con qué rol.
4. **Recursos**: inventario global filtrable por proveedor, tipo, proyecto, entorno y estado.
5. **Guías**: runbooks, plantillas y ejecuciones de setup.
6. **Migraciones**: planes de cambio, checklist, dependencias y exportación.
7. **Workspace**: equipo, permisos, facturación futura y preferencias.

Para el primer sprint, mostrar solo los módulos desarrollados; el resto no debe aparecer como pantalla vacía.

### Pantalla de proyecto: estructura

Encabezado: nombre, dominio, descripción corta, entornos y enlaces principales.

Secciones/tabs:

- **Vista general**: «Dónde está cada cosa» con categorías y cuentas asociadas.
- **Recursos**: tabla con proveedor, nombre, entorno, administrador, login, estado y enlaces.
- **Dependencias**: lista de relaciones e impacto; grafo visual después.
- **Configuración**: metadatos no secretos (URLs, nombres de variables, referencias Bitwarden).
- **Guías**: README de desarrollo, incorporación, despliegue y recuperación.
- **Migraciones**: pendientes, completadas y plantillas.
- **Actividad**: modificaciones recientes.

### Vistas especialmente útiles

- **Vista por identidad**: «Muestra todo lo que administro con Google A».
- **Vista por correo**: «Muéstrame todas las cuentas que lo usan para login, recuperación, alertas o pagos».
- **Vista por proveedor**: «Tengo tres productos de Google y dos cuentas diferentes».
- **Vista por activo**: contexto completo, accesos, dependencias, runbooks asociados.
- **Vista de impacto**: «¿Qué puede verse afectado si elimino/cambio esto?».
- **Vista de pendientes**: lo que falta confirmar; sin fingir verificación automática.

### Búsqueda

Buscar por nombre, alias, proveedor, dominio, URL, correo (si el usuario tiene permiso), etiquetas y descripción. Filtros: workspace, cliente, proyecto, entorno, cuenta, estado y propietario. Implementar paginación en servidor pensando en miles de recursos.

---

## 6. Onboarding extremadamente sencillo

**Objetivo UX:** conseguir un primer mapa útil sin que el usuario tenga que comprender el modelo de datos.

### Flujo personal (5 pasos, progresivo)

**Paso 1 — «¿Qué quieres organizar?»** (Fase 1)

- «Mis proyectos» (única opción visible en Fase 1; equipo y agencia no se muestran como opciones hasta fases posteriores)

**Paso 2 — Crear primer proyecto**

Nombre, dominio principal (opcional), descripción opcional, entorno opcional. Ej.: Mini Críptico / `minicriptico.com`.

**Paso 3 — «¿Qué herramientas utilizas?»**

Selector rápido con iconos: Google, GitHub, Cloudflare, AWS, Namecheap, Hostinger, VPS, correo, TikTok, Instagram, YouTube, Bitwarden y «Otro». El proveedor solo crea un borrador; preguntar qué **recurso concreto** utiliza. No crear automáticamente cuentas reales inexistentes.

**Paso 4 — «¿Con qué cuentas entras?»**

Permitir añadir alias «Google A» / «Google B» y correos de login, y asignar cada recurso a una cuenta. Siempre permitir **«No lo sé todavía»**.

**Paso 5 — Primer resultado**

Mostrar mapa y tres acciones: «Completar lo que falta», «Añadir más recursos» y «Generar guía de setup».

### Importación y onboarding rápido

- CSV de recursos con columnas sugeridas: `project`, `provider`, `asset_type`, `asset_name`, `login_email`, `environment`, `admin_url`, `notes`.
- Vista previa antes de importar, detección de duplicados por combinación lógica, resolución manual y reversión del lote de importación.
- Permitir pegar una lista en texto libre para futura conversión **asistida**, pero sin afirmar que la IA la interpretó si no está implementada.
- Plantillas por tipo: «web SaaS», «WordPress cliente», «app móvil», «creador de contenido».
- Guardado automático de borradores, estados vacíos útiles, posibilidad de saltar preguntas, formularios cortos.
- No pedir conectar Google, GitHub o AWS en el onboarding inicial. Integraciones opcionales en fases posteriores, con consentimiento explícito.

### Alcance Fase 1

El flujo de 5 pasos y la importación CSV (preview/commit) se entregan en **Fase 1**, junto con el CRUD de inventario. No es un onboarding posterior al inventario.

### Criterios de éxito de onboarding

- Primer proyecto + 5 recursos creados en una sesión corta.
- El usuario puede saber qué cuenta administra un recurso mediante máximo 2–3 clics.
- Ningún paso solicita secretos.
- Se pueden añadir recursos sin elegir un proveedor del catálogo.
- Se puede reabrir y completar un onboarding incompleto.

---

## 7. Gestión de recursos, cuentas, identidades y correos

### Recurso (`asset`): campos mínimos

- `id`, `workspace_id`, `name`, `type`, `provider_id` opcional.
- `provider_account_id` opcional; debe pertenecer al mismo workspace.
- `description`, `status` (`active|planned|retired|unknown`).
- `environment_id` opcional; `criticality` (`low|medium|high|critical`).
- `admin_url` y `public_url` opcionales, validadas; nunca incrustar tokens en URLs.
- `external_identifier` opcional (ID público/no secreto, posible enmascaramiento).
- `notes` descriptivas y sin secretos.
- `created_at`, `updated_at`, `archived_at`.
- Asociaciones a uno o varios proyectos, etiquetas, roles, verificación, dependencias y vault references.

### Identidad (`identity`)

Ejemplos: «Google A», «Google B», «Cuenta GitHub», «Usuario VPS de despliegue», «Cuenta AWS IAM Identity Center». Representa un principal de autenticación. Puede ser persona, usuario técnico o cuenta de servicio. No confundir un usuario SSH de un VPS con la cuenta que paga ese VPS.

Campos: nombre descriptivo, tipo, proveedor, identificador público opcional, correos asociados, método de acceso (`password|oauth|sso|ssh|passkey|unknown`, descriptivo), estado y notas.

**No guardar:** passwords, private keys, access tokens, refresh tokens, cookies, recovery codes, passkeys, OTP seeds ni sus equivalentes.

### Cuenta de proveedor (`provider_account`)

Ej.: «Google principal de Mini Críptico», «AWS producción», «Namecheap personal». Puede ser administrada por varias identidades. Puede contener muchos activos y puede tener entidad propietaria o pagadora diferente a las personas que la utilizan.

### Direcciones de correo (`email_address`)

- `address` (única en el contexto donde corresponda; permitir compartirla entre identidades si tiene sentido).
- `label` («correo de facturación», «correo personal», etc.).
- Relaciones etiquetadas `login`, `recovery`, `billing`, `notification`, `contact`, `alias`, `owner_contact`.
- Un correo **no es** necesariamente un buzón existente; puede ser alias o grupo. Registrar `mailbox_type` si procede.
- Asociar el correo tanto a identidades **como a cuentas de proveedor y activos concretos** (tablas de relación), porque el email de facturación de AWS puede ser distinto del login de AWS, y el email de notificaciones de Search Console puede tener un rol propio.
- Antes de guardar la dirección, preguntar por su finalidad. Un email de recuperación no implica permisos de administración.
- Mostrar «cambiar correo» como una **tarea con impacto**, no una actualización trivial de un string.

### Roles de acceso

Roles semánticos por recurso: `owner`, `account_holder`, `admin`, `operator`, `developer`, `billing`, `recovery_contact`, `viewer`, `other`. Conservar además el nombre real del rol del proveedor en un campo libre (`provider_role_label`): «Owner», «Manager», «Verified owner», «Editor», «Administrator», etc.

Una relación `identity_asset_role` lleva estado de verificación y fechas. Los roles genéricos sirven para el producto, no sustituyen los permisos reales del proveedor.

---

## 8. Dependencias y análisis de impacto

### Tipos de relación recomendados

- `depends_on`: A necesita a B para funcionar.
- `hosted_on`: app alojada en servidor.
- `deployed_from`: app desplegada desde repositorio.
- `authenticated_by`: app utiliza proveedor/cliente de autenticación.
- `stores_data_in`: app usa storage o base de datos.
- `sends_email_via`: app envía correo por un servicio.
- `domain_registered_at`: dominio registrado en registrador.
- `dns_managed_by`: zona DNS gestionada en proveedor.
- `verified_with`: una propiedad utiliza un método de verificación determinado.
- `publishes_to`: un proceso publica en canal/cuenta.
- `billed_through`: pago atribuido a cuenta/proveedor.
- `recovery_depends_on`: recuperación de una cuenta depende de correo/identidad.
- `other`: relación personalizada.

**Diseño:** las relaciones tienen dirección (`from`, `to`), tipo, descripción, verificación, `workspace_id`. Limitar referencias al mismo workspace. No asumir que una relación crea automáticamente su inversa de negocio.

### Ejemplo de Mini Críptico (hipótesis que debe confirmarse)

```text
Mini Críptico / Production
├── Web / aplicación
│   ├── deployed_from -> GitHub repo web (por confirmar)
│   ├── hosted_on -> VPS-01 (por confirmar)
│   ├── authenticated_by -> Google OAuth client / Google Cloud project
│   ├── stores_data_in -> Cloudflare image storage (confirmar uso concreto)
│   └── sends_email_via -> AWS SES (si el flujo correspondiente usa SES)
├── Dominio minicriptico.com
│   ├── domain_registered_at -> Namecheap (confirmar)
│   └── dns_managed_by -> proveedor DNS por confirmar
├── Buzones / correo entrante
│   └── hosted_on / provided_by -> OpenShip (confirmar arquitectura)
├── Canal YouTube -> administradores Google A/B por confirmar
├── Google Search Console -> propietarios y verificación por confirmar
└── Instagram / TikTok -> cuentas, permisos y procesos por completar
```

**Análisis de impacto:** dado un activo o identidad, recorrer relaciones relevantes, exponer recorrido y grado de certeza. Ej.: «VPS-01 → aplicación web → producción». Mostrar explícitamente si alguna arista es hipotética/no verificada.

**Evitar ciclos infinitos:** detección de visitados y límite de profundidad; no representar `billed_through` como dependencia de disponibilidad salvo que el usuario lo indique.

### Configuraciones que merece la pena documentar (sin secretos)

El inventario no debe quedarse en «tengo Google OAuth». Para cada recurso, ofrecer configuraciones estructuradas con `nombre`, `descripción`, `tipo`, `entorno`, `ubicación administrativa`, `fecha de revisión`, `relación` y `referencia al vault` si procede.

| Recurso | Configuración de ejemplo | Tratamiento |
| --- | --- | --- |
| Google OAuth | Nombre de Google Cloud project, ID del proyecto, tipo de OAuth client | Metadatos no secretos, visibilidad configurable |
| Google OAuth | Redirect URIs, authorized JS origins, scopes, estado de consent screen | Datos de configuración documentables; validar con plataforma |
| Google OAuth | `GOOGLE_CLIENT_SECRET` | **Solo nombre de variable y referencia a Bitwarden** |
| YouTube | URL de canal, ID público de canal, tipo de acceso, lista declarada de responsables | Metadatos; no confundir con permisos verificados |
| Google Ads | ID de cuenta (enmascarado si se exporta), manager account si existe, propietarios | Metadatos; niveles de permiso por confirmar |
| Search Console | Property type (domain/URL-prefix), método de verificación, cuenta con ownership | Documentar método, no token de verificación secreto |
| Namecheap / DNS | Registrador, fecha de renovación, proveedor DNS, nameservers, referencias a zona | Metadatos; export de registros DNS separado y revisado |
| OpenShip / correo | Hostnames IMAP/SMTP, puertos, tipos de buzón, certificados y DNS relacionados | No incluir contraseñas, claves privadas ni tokens |
| AWS SES | Región, dominios verificados, nombres de variables, remitentes y callbacks | Nunca credenciales SMTP/API en la app |
| VPS | Hostname, servicio, OS, puerto SSH, usuario no privilegiado, despliegue y backup | No copiar claves SSH ni comandos con tokens |
| GitHub | URL de repo, branches, pipeline, workflow path y destinos de despliegue | Solo nombres/URLs autorizados, sin secrets CI |
| Cloudflare storage | Tipo real de producto, nombre del recurso, endpoint público y consumidor | No guardar credenciales de acceso |
| Instagram / TikTok | Usuario público, identidad de administración, URLs de paneles y acciones de publicación | No copiar cookies ni tokens de sesión |

La app debe permitir **configuraciones desconocidas o pendientes** y señalar qué configuraciones son necesarias para completar un setup o una migración. No inventar OAuth redirect URIs ni registrar valores provenientes de suposiciones.

---

## 9. Guías de setup / Runbooks estilo README

### Objetivo

Generar un **README práctico, casi automático a partir del inventario**, útil para:

- Preparar una máquina de desarrollo nueva.
- Incorporar a un colaborador sin compartir cuentas personales.
- Recrear staging desde cero.
- Recuperar un servicio en una máquina diferente.
- Publicar o desplegar una nueva versión.
- Cambiar la persona encargada de un proyecto.

### Tres capas

1. **Plantilla reusable (`runbook_template`)**: pasos genéricos por tipo de tarea o proveedor.
2. **Runbook específico (`runbook`)**: instancia ligada a proyecto/entorno/recursos.
3. **Ejecución (`runbook_execution`)**: una persona sigue los pasos, aporta confirmaciones y registra resultados en una fecha.

Un README exportado es una **instantánea** de un runbook en una versión. No modifica producción ni garantiza que esté actualizado.

### Estructura de un paso

- Título e instrucciones Markdown.
- Tipo: `manual|reference|command_suggestion|validation|approval`.
- Dependencias con otros pasos (DAG).
- Recursos y cuentas vinculados.
- Requisitos previos (permisos, software, hardware, acceso VPN).
- Variables de plantilla permitidas (p. ej. `{{project.name}}`, `{{asset.public_url}}`, `{{vault_ref.label}}`).
- Comando sugerido **como texto**, nunca ejecutado automáticamente en MVP.
- Resultado esperado verificable y campo de evidencia.
- Riesgo: `low|medium|high`.
- Necesidad de aprobación o revisión humana.
- Plan alternativo / notas de recuperación, si aplica.
- Estado de ejecución (`todo|blocked|in_progress|done|skipped|failed`).

### Ejemplo detallado: incorporación de un desarrollador a Mini Críptico

1. Leer arquitectura, repositorios y mapa de servicios en AccessMap.
2. Disponer de cuenta individual de GitHub. Solicitar permiso mínimo a los repositorios necesarios; no usar las credenciales personales del fundador.
3. Localizar repositorios correctos y comprobar qué ramas y entornos existen.
4. Instalar Node y gestor de paquetes en las versiones documentadas (`.nvmrc` / `packageManager` del repositorio). No inventar versiones.
5. Clonar el repositorio autorizado y ejecutar instalación de dependencias según sus scripts reales.
6. Generar `.env.local` desde `.env.example` **sin incluir secretos en AccessMap**; recuperar valores de Bitwarden únicamente cuando esté autorizado y según el entorno.
7. Preparar la base de datos local con las migraciones y seeds disponibles en el repo; confirmar si hay datos personales o de producción que no se deban copiar.
8. Configurar credenciales de desarrollo separadas de producción (OAuth, correo, storage) si corresponden.
9. Ejecutar aplicación local y comprobar login, renderizado, conexión a datos y funcionalidades clave.
10. Confirmar que ningún secreto entró al repositorio, tickets o logs.
11. Marcar los pasos completados y registrar los bloqueos con responsable.

#### Ejemplo de exportación `SETUP_MINICRIPTICO.md`

```markdown
# Preparar entorno de desarrollo — Mini Críptico

> Generado desde AccessMap. Revisado: FECHA. Este documento NO contiene secretos.

## Antes de empezar
- [ ] Cuenta individual de GitHub con permisos concedidos.
- [ ] Acceso autorizado al vault de Bitwarden correspondiente.
- [ ] Node/gestor de paquetes según el repositorio (revisar archivos de versión).

## Código
- Repo principal: <URL_DEL_REPO>
- Rama recomendada: <RAMA_CONFIRMADA>
- [ ] Clonar el repositorio.
- [ ] Instalar dependencias (consultar script del repo).

## Variables y servicios
- `DATABASE_URL`: consultar referencia en Bitwarden de entorno local.
- `GOOGLE_CLIENT_ID`: identificar OAuth client de desarrollo; el valor no se copia aquí.
- `GOOGLE_CLIENT_SECRET`: solo si la arquitectura lo necesita; referencia externa al vault.
- `AWS_REGION`: documentar el valor no secreto si está confirmado.
- [ ] Nunca reutilizar credenciales de producción para desarrollo sin necesidad y autorización.

## Validación
- [ ] La web arranca localmente.
- [ ] La conexión a base de datos local funciona.
- [ ] El flujo OAuth de desarrollo funciona.
- [ ] No hay secretos en git ni en logs.
```

Los nombres de variables de ejemplo deben ajustarse a las **variables reales** de los repositorios. Importante: **el nombre de una variable tampoco revela por sí solo dónde está configurada**; AccessMap necesita asociarlo al recurso y entorno adecuados.

### Ejemplo de estructura de plantilla (orientativo, no código ejecutable)

```json
{
  "slug": "new-developer-onboarding",
  "version": 1,
  "requiredInputs": ["projectId", "environmentId"],
  "steps": [
    {
      "key": "repository-access",
      "kind": "manual",
      "title": "Confirmar acceso individual al repositorio",
      "requires": [],
      "assetType": "repository",
      "risk": "low",
      "successCriteria": "La persona puede leer el repositorio con su propia cuenta"
    },
    {
      "key": "configure-env",
      "kind": "reference",
      "title": "Preparar variables de entorno usando el vault externo",
      "requires": ["repository-access"],
      "risk": "medium",
      "successCriteria": "Archivo local configurado sin publicar secretos"
    }
  ]
}
```

Reglas del generador: no incluir un paso si falta su recurso asociado sin mostrar «pendiente de completar»; detectar ciclos en dependencias de pasos; congelar la versión usada al crear una ejecución; soportar reordenación manual sin romper dependencias; exportar en el **locale activo** del usuario (fallback inglés).

### «Casi automático» en etapas

- **MVP:** generar pasos y README desde relaciones registradas + plantillas; precompletar nombres, enlaces y referencias; ejecutar checklist manual.
- **V1:** importar metadatos de un `README.md`, `.env.example`, `package.json`, `Dockerfile`, `docker-compose.yml` y CI de un repo con permiso de lectura; sugerir pasos que el usuario confirma.
- **V2:** detectar cambios entre metadatos del repo y guía, proponer actualización y verificar algunos prerrequisitos mediante integraciones autorizadas.
- **NO por defecto:** ejecutar comandos shell, descargar secretos, desplegar, modificar DNS o cambiar permisos.

### Seguridad del generador

No interpolar automáticamente en Markdown cadenas que parezcan tokens. No ejecutar scripts generados por usuarios ni descargados de repositorios. Si más adelante se crea un ejecutor, debe ser local y explícito, con lista blanca, preview y aprobación; fuera de MVP.

---

## 10. Motor de planes de migración

### Qué es

Un **plan de cambio** no es un tutorial genérico. Es una checklist adaptada a recursos reales y sus dependencias:

- Origen y destino.
- Objetivo y alcance.
- Inventario de lo afectado.
- Prerrequisitos y verificaciones previas.
- Exportación / copia o creación del recurso destino.
- Cambio de integraciones y dependencias.
- Pruebas de equivalencia y humo.
- Cutover planificado.
- Período de observación y rollback cuando sea posible.
- Cierre, eliminación de accesos viejos y actualización del mapa.

### Entidades

- `migration_template`: receta reusable («GitHub → Bitbucket», «registrador → registrador»).
- `migration_plan`: instancia con origen, destino, proyecto, entorno, estado, fecha/ventana opcional.
- `migration_step`: instrucciones y criterios de aceptación, orden, dependencia, riesgo, evidencia.
- `migration_impact`: recursos relacionados que pueden necesitar cambios.
- `migration_execution_event`: historial de avance, aprobaciones y fallos.

**Estados:** `draft → reviewed → approved → in_progress → verifying → completed` o `cancelled|blocked|rollback_in_progress|rolled_back`. No marcar `completed` sin validaciones obligatorias. Un rollback no siempre es posible; debe indicarse.

### Ejemplo de instancia de plan (orientativo)

```json
{
  "template": "github-to-bitbucket",
  "project": "Mini Críptico",
  "source": "GitHub / repo web (pendiente de ID real)",
  "target": "Bitbucket / repo nuevo (planificado)",
  "status": "draft",
  "impactCandidates": [
    { "kind": "deployment", "reason": "Posible pipeline desde repositorio", "verified": false },
    { "kind": "ssh-key", "reason": "Posible deploy key ligada a GitHub", "verified": false },
    { "kind": "webhook", "reason": "Revisar integraciones salientes", "verified": false }
  ],
  "cutoverRequiresApproval": true,
  "automationEnabled": false
}
```

El plan distingue **impactos confirmados** (relaciones del inventario) de **comprobaciones sugeridas** (posibles dependencias habituales). Ambos se muestran con distinto estado visual.

### Detección de impacto

Ej.: si se cambia de GitHub a Bitbucket, AccessMap examina relaciones `deployed_from` y puede sugerir revisar CI/CD, webhooks, claves de despliegue, secretos y accesos. **No afirmar que detectó esos elementos** si no están documentados o no existe una integración que los verifique.

### Flujos de colaboración

- Una persona puede redactar y otra aprobar.
- Pasos con responsable y fecha opcional.
- Exportación a Markdown legible y JSON estructurado.
- Historial de quién marcó cada paso y cuándo.
- La ejecución es un registro manual de cambios efectuados fuera de AccessMap, no una automatización operativa.

---

## 11. Recetas y ejemplos específicos de migración

### 11.A — GitHub → Bitbucket (repositorios)

**Caso:** mover dos repositorios de Mini Críptico a Bitbucket sin interrumpir despliegues.

**Preflight:**

1. Listar repositorios y titulares actuales; confirmar acceso administrativo en origen y destino.
2. Registrar ramas, tags, Git LFS si existe, reglas de protección, releases, issues/PRs importantes, wiki y permisos.
3. Identificar CI/CD (GitHub Actions), webhooks, GitHub Apps, secrets, variables, deploy keys, submodules, links externos, Docker/registries, dependencias en GitHub URLs.
4. Localizar qué servidores/despliegues hacen `git clone`, `git pull` o consumen artefactos desde GitHub.
5. Definir ventana de congelación de cambios y copia de seguridad/exportación.

**Ejecución sugerida, no automática:**

1. Preparar workspace, repos y permisos en Bitbucket.
2. Usar el importador oficial o un procedimiento de mirror **validado para el repositorio**; no asumir que importa PRs, issues, pipelines y secretos. Documentar explícitamente lo que no migra.
3. Validar ramas, tags, commits, LFS y acceso del equipo.
4. Rehacer CI/CD y secretos en el sistema de destino; no copiar secretos en AccessMap.
5. Reconfigurar webhooks, deploy keys/SSH, remotes locales, documentación y automatizaciones.
6. Ejecutar un despliegue de prueba desde Bitbucket y verificar el sistema.
7. Cortar los cambios en origen según el plan; mantener el repositorio original archivado o de solo lectura si conviene.
8. Registrar validaciones finales, propietarios y rollback.

**Rollback:** conservar remotos/CI anteriores temporalmente, si siguen operativos; evitar escrituras divergentes en origen/destino. **No** asumir reversibilidad automática de cambios de CI, permisos o artefactos.

**Nota:** el importador de Bitbucket puede copiar el repositorio Git, pero no es una garantía de transferencia completa de toda la configuración y el historial colaborativo de GitHub.

### 11.B — Namecheap → Hostinger: transferencia de registrador

**Distinguir tres operaciones distintas:**

1. Cambiar **registrador** (dónde se renueva el dominio).
2. Cambiar **DNS autoritativo** (dónde están los registros).
3. Cambiar **hosting** (dónde responde la web).

Se pueden hacer por separado; no mezclar sus pasos automáticamente.

**Preflight:**

1. Confirmar que el dominio está realmente registrado en Namecheap y elegible para transferencia.
2. Revisar bloqueos de transferencia, email de contacto y requisitos del dominio/TLD. Los dominios genéricos pueden estar sujetos a restricciones/periodos de bloqueo; no prometer una transferencia instantánea.
3. Documentar DNS actual: A/AAAA, CNAME, MX, TXT, SPF, DKIM, DMARC, CAA, SRV, DNSSEC y verificaciones de terceros, según existan.
4. Documentar todas las dependencias: sitio web, Search Console, OAuth callbacks, OpenShip, SES, Cloudflare y otros.
5. Revisar expiración, renovaciones y contacto de recuperación.

**Plan:**

1. Preparar cuenta destino y los datos requeridos.
2. Solicitar/desbloquear transferencia siguiendo el proceso y el código de autorización del registrador **sin guardar el código en AccessMap**.
3. Mantener DNS operativo durante la transferencia; cambiar nameservers solo si también es objetivo y está planificado.
4. Si DNS cambia, copiar/verificar la zona antes del corte y revisar DNSSEC/DS, MX, SPF, DKIM, DMARC, CAA y registros de verificación.
5. Probar web, correo entrante/saliente, envío transaccional, OAuth redirects y servicios afectados.
6. Confirmar titularidad, renovación y configuración de recuperación en el registrador destino.

**Rollback:** una transferencia de registrador completada no siempre se revierte de inmediato. Planear mitigación por DNS y soporte; evitar prometer rollback instantáneo.

### 11.C — Cuenta Google A → Cuenta Google B para un proyecto

**No es una «migración de Google» universal.** Es un conjunto de cambios de roles/propiedad **producto por producto**, con distintas restricciones y controles.

- **YouTube:** comprobar si el canal usa permisos de YouTube Studio y/o Brand Account; invitar a B con rol compatible, confirmar acceso y revisar restricciones antes de quitar A.
- **Google Search Console:** consultar tipo de propiedad, owner verificado/delegado y métodos/tokens de verificación; verificar B de forma adecuada y no quitar al último owner válido.
- **Google Ads:** invitar B con permisos apropiados o revisar manager account; probar acceso y revisar facturación/administración.
- **Google Analytics / GA4 (si existe):** revisar permisos por cuenta o propiedad; confirmar acceso de B en el alcance correcto.
- **Google Cloud / OAuth:** añadir a B a los proyectos de Google Cloud usando IAM con permisos mínimos; revisar quién puede mantener la configuración OAuth, branding, client IDs, URIs, APIs y billing. **No tratar un OAuth client como algo que se puede «mover» entre proyectos con un clic**.
- **Recovery:** revisar direcciones de recuperación y factores de seguridad sin copiar secretos.
- **Servicios externos con «Sign in with Google»:** cada uno requiere revisión independiente; cambiar el email en AccessMap **no** cambia el login del servicio.

**Criterios de finalización:** B entra realmente en cada producto, se confirma rol correcto, se garantiza continuidad/recuperación y solo entonces se retira A donde sea posible y deseado. Algunos recursos pueden no ser transferibles sin procesos adicionales.

### 11.D — Cliente OAuth de Google: recrear proyecto/credenciales

**Caso:** dejar de usar un proyecto Google Cloud anterior para el login de Mini Críptico.

1. Documentar Google Cloud project actual, OAuth client(s), tipo de cliente, consent/branding, scopes, test users si proceden, URIs autorizadas y APIs implicadas; sin secrets.
2. Identificar recursos que dependen del OAuth client (frontend/backend, callback endpoints, entornos, dominios autorizados).
3. Crear/configurar nuevo proyecto/cliente según documentación vigente y permisos autorizados.
4. Registrar **nueva** referencia de secreto en Bitwarden y nuevos valores de configuración en los entornos pertinentes; nunca copiar el secreto en AccessMap.
5. Validar flujos de login, consentimientos, cuentas existentes, refresh/session behavior y posibles requisitos de verificación de app.
6. Ejecutar cutover por entorno; monitorizar errores y disponer de una ventana para volver a la configuración anterior si sigue permitida.
7. Retirar credenciales antiguas **solo después** de confirmar el estado de los consumidores.

**Nota crítica:** cambios de OAuth pueden requerir nuevo consentimiento de usuarios, comprobaciones de scopes/branding o afectan sesiones. Nunca asumir que mantener el mismo email conserva client IDs o permisos.

### 11.E — Migrar un VPS / servidor

1. Inventariar servicios, puertos, DNS, IP, certificados, procesos, systemd, Docker, cron, backups, discos, volúmenes, base de datos, firewall y usuarios SSH.
2. Revisar las dependencias: repositorios/CI, correo, almacenamiento, callbacks, claves de despliegue, monitoring, webhooks.
3. Aprovisionar servidor destino con acceso individual y SSH keys gestionadas externamente.
4. Reproducir configuración a partir de scripts del repositorio y la guía, sin guardar secretos en AccessMap.
5. Restaurar datos y comprobar integridad, backups y permisos.
6. Probar en destino; planificar corte de tráfico y sincronización final de datos si aplica.
7. Confirmar health checks, SSL, rendimiento, colas, correos y escrituras.
8. Conservar rollback y apagar origen solo tras periodo de observación.

**No ejecutar `rsync`, `ssh`, DNS ni comandos destructivos desde AccessMap MVP.**

### 11.F — Cambiar envío transaccional de AWS SES a otro proveedor

1. Distinguir el **envío de correo de la aplicación** del servicio que aloja los buzones (OpenShip).
2. Identificar región SES, identidades verificadas, DKIM, SPF/DMARC, credenciales referenciadas, límites, eventos, bounces, suppression lists y aplicaciones consumidoras.
3. Preparar verificación/autenticación del dominio en el nuevo proveedor y revisar DNS sin romper correo entrante.
4. Actualizar configuración en staging, probar remitentes, rebotes, enlaces y entregabilidad.
5. Planificar cutover y seguimiento de envíos; mantener alternativa si es viable.
6. Retirar configuración anterior cuando se confirme la transición.

### 11.G — Migrar correo alojado en OpenShip a otro servidor

1. Documentar buzones, alias, listas, protocolos/puertos y configuración del servidor actual.
2. Confirmar copias/retención, tamaño de buzones y método de sincronización autorizado.
3. Preparar servidor destino y cuentas sin publicar credenciales.
4. Planificar sincronización de correo, MX/SPF/DKIM/DMARC según aplique.
5. Probar recepción, envío, IMAP/SMTP y clientes móviles.
6. Revisar restricciones de entrega, reputación, backups y rollback.

### 11.H — Cambiar almacenamiento de imágenes de Cloudflare a otra solución

1. Confirmar si el producto actual es R2, Images u otro; no suponer.
2. Inventariar buckets, objetos, URLs públicas, transformaciones, CORS, reglas de acceso, endpoints y aplicaciones consumidoras.
3. Copiar datos mediante herramienta apropiada, validar checksum/recuento y permisos.
4. Preparar cambios de URL/redirects o proxy/CDN, y actualizar código/configuración.
5. Probar publicación y lectura de imágenes, cache e invalidación.
6. Hacer cutover y monitorizar errores 404/403 antes de retirar origen.

### 11.I — Cambiar una identidad de recuperación o facturación

1. Encontrar todos los activos asociados a ese email por rol: login, recovery, billing, notificaciones y ownership.
2. Agrupar cambios por proveedor; revisar impacto de la pérdida de acceso al buzón original.
3. Actualizar cada servicio en su interfaz correspondiente, respetando verificaciones y restricciones.
4. Confirmar con la cuenta nueva y mantener trazabilidad.
5. Actualizar referencias en AccessMap. Nunca afirmar que cambió el login del servicio al editar el registro local.

---

## 12. Plantillas: catálogo inicial

Cada plantilla define precondiciones, preguntas, recursos esperados, pasos, validaciones y límites. Categorías:

**Setup:**

- `new-developer-onboarding` — Incorporación de desarrollador.
- `new-local-machine` — Preparar portátil nuevo.
- `new-production-vps` — Preparar VPS de producción (plan, no ejecución).
- `new-staging-environment` — Crear staging.
- `setup-google-oauth` — Documentar y configurar OAuth.
- `setup-ses-domain` — Documentar SES y DNS.
- `setup-youtube-access` — Preparar permisos del canal.
- `setup-gsc-ownership` — Verificar propiedad Search Console.
- `prepare-project-handover` — Entrega a otro desarrollador.

**Migración:**

- `github-to-bitbucket`.
- `registrar-to-registrar` (instancia Namecheap → Hostinger).
- `dns-provider-to-dns-provider`.
- `hosting-provider-change`.
- `vps-to-vps`.
- `google-identity-reassignment`.
- `google-oauth-client-replacement`.
- `email-hosting-change`.
- `transactional-email-provider-change`.
- `object-storage-change`.
- `employee-offboarding` (fase equipos).

Las plantillas genéricas deben contener advertencias si faltan datos de entorno/proveedor. No mostrar instrucciones como verificadas cuando sean un borrador.

---

## 13. Generación de documentos

**Exportaciones mínimas:**

- **README del proyecto:** overview, tecnologías, enlaces de consola, mapa de recursos, repos, entornos y responsables; excluir datos sensibles.
- **README de setup:** prerrequisitos, pasos, nombres de variables no secretos, referencias a vault, validaciones y fecha de revisión.
- **Plan de migración:** origen, destino, recursos afectados, preflight, procedimiento, validaciones, rollback y responsables.
- **Inventario CSV / JSON:** datos autorizados filtrados, con opción de excluir emails y notas privadas.

### Metadatos de cada documento

- Fecha de generación, versión de plantilla, proyecto/workspace y fecha de última verificación de los recursos incluidos.
- Aviso si hay recursos `unverified`.
- Fuente por elemento cuando se disponga (`manual`, `import`, integración).
- El documento es un **snapshot**. Cambios en AccessMap no alteran automáticamente un README ya exportado.

**Edición:** permitir modificar runbooks en Markdown dentro del producto y regenerar solo secciones automáticas conservando bloques manuales. MVP: una versión más simple de *plantilla con campos + notas propias*; evitar un complejo editor WYSIWYG.

---

## 14. Multi-tenant y agencias desde el primer día

Modelo inicial:

```text
User
  └── Membership -> Workspace (personal | team | agency)
                      ├── Clients? (solo si hay clientes)
                      ├── Projects
                      ├── Identities / Email addresses / Provider accounts
                      ├── Assets / Dependencies / Roles
                      ├── Runbooks / Executions
                      └── Migration plans / Executions
```

**Reglas:**

- Todo objeto de negocio pertenece exactamente a un `workspace_id`.
- `client_id` es opcional para personal y freelance; un proyecto puede pertenecer a un cliente en modo agencia.
- Un workspace puede tener cientos de proyectos y miles de clientes. Queries indexadas/paginadas.
- `workspace_members`: roles `owner`, `admin`, `editor`, `viewer`. Los permisos por cliente/proyecto se pueden incorporar después, pero evitar una arquitectura que los imposibilite.
- A futuro: roles externos de cliente y vínculos a usuarios limitados al cliente.
- Prohibido hacer joins o mutations cruzando workspaces.
- **Mover/copia de proyecto personal a agencia:** acción explícita, vista previa y autorización; eliminar o revisar notas privadas, referencias a vault y emails antes de compartir. Nunca compartir automáticamente activos personales.
- Las plantillas comunes pueden ser globales, pero datos y ejecuciones son por workspace.

---

## 15. Modelo relacional propuesto (v0)

Usar PostgreSQL. Preferir columnas tipadas para datos estructurales y `jsonb` solo para metadatos específicos de proveedor con validación por esquema.

### Tablas núcleo

```text
users
workspaces (id, type, name, owner_user_id, created_at, updated_at)
workspace_members (workspace_id, user_id, role, joined_at)
clients (id, workspace_id, name, status)
projects (id, workspace_id, client_id NULL, slug, name, description, website_url)
project_environments (id, workspace_id, project_id, name, kind)
providers (id, slug UNIQUE, name, category, website_url, is_system)
identities (id, workspace_id, provider_id NULL, label, principal_type, auth_method, status)
email_addresses (id, workspace_id, address, label, mailbox_type)
identity_emails (id, workspace_id, identity_id, email_id, purpose)
provider_account_emails (id, workspace_id, account_id, email_id, purpose, verification_id NULL)
asset_emails (id, workspace_id, asset_id, email_id, purpose, verification_id NULL)
provider_accounts (id, workspace_id, provider_id, label, account_identifier, status)
provider_account_identities (id, workspace_id, account_id, identity_id, role_label, verification_id NULL)
assets (id, workspace_id, provider_id NULL, provider_account_id NULL, name, type, status, criticality, admin_url, public_url, external_identifier, description, attributes_jsonb)
project_assets (workspace_id, project_id, asset_id, environment_id NULL, purpose)
asset_roles (id, workspace_id, asset_id, identity_id NULL, party_id NULL, role_type, provider_role_label, verification_id NULL)
parties (id, workspace_id, kind, name, notes)  -- personas/organizaciones externas si hace falta
asset_dependencies (id, workspace_id, from_asset_id, to_asset_id, relation_type, description, verification_id NULL)
config_entries (id, workspace_id, project_id, environment_id NULL, asset_id NULL, key, description, value_type, public_value NULL, is_sensitive_reference)
vault_references (id, workspace_id, project_id NULL, asset_id NULL, label, vault_provider, location_hint, notes)
verifications (id, workspace_id, source_type, status, checked_by_user_id NULL, checked_at NULL, evidence_note, evidence_url NULL)
tags / entity_tags
```

**Nota de modelado:** la referencia `verification_id` puede crecer y necesitar historial separado (`verification_events`). Para MVP usar una relación clara y conservar el historial mediante auditoría; no sobrescribir resultados de verificaciones pasadas sin trazabilidad.

### Runbooks y migraciones

```text
runbook_templates (id, slug, version, title, schema_jsonb, content_markdown)
runbooks (id, workspace_id, project_id NULL, template_id NULL, title, status, version)
runbook_steps (id, workspace_id, runbook_id, step_key, position, kind, title, body_markdown, risk, depends_on_jsonb, is_required)
runbook_executions (id, workspace_id, runbook_id, started_by, status, started_at, completed_at)
runbook_step_results (id, workspace_id, execution_id, step_id, status, result_note, verified_by NULL, completed_at NULL)
migration_templates (id, slug, version, title, schema_jsonb)
migration_plans (id, workspace_id, project_id NULL, template_id NULL, title, source_asset_id NULL, target_asset_id NULL, status, planned_at NULL)
migration_steps (id, workspace_id, plan_id, step_key, position, kind, title, body_markdown, risk, depends_on_jsonb, is_required)
migration_impacts (id, workspace_id, plan_id, asset_id, impact_type, notes, confirmed)
migration_events (id, workspace_id, plan_id, step_id NULL, actor_user_id, event_type, note, created_at)
audit_events (id, workspace_id, actor_user_id NULL, entity_type, entity_id, action, safe_diff_jsonb, created_at)
```

### Restricciones importantes

- Índices por `workspace_id`, `project_id`, `provider_id`, `asset_id`, `status`, y búsqueda full-text si aplica.
- Foreign keys y restricciones de unicidad por workspace, no unicidades globales incorrectas en recursos.
- Para evitar referencias cruzadas, emplear FKs compuestas con `(workspace_id,id)` en entidades multi-tenant o validaciones equivalentes reforzadas por la base de datos. No confiar solo en el frontend.
- Evitar borrados en cascada que eliminen historial de auditoría. Archivar cuando corresponda.
- `config_entries.public_value` solo para valores explícitamente **no secretos**; en los tipos sensibles almacenar únicamente referencia a vault. Aplicar validación de campos y filtros de patrones de secretos, pero no prometer detección perfecta.
- HTML/Markdown escapado/sanitizado al renderizar; URLs validadas, bloqueo de protocolos peligrosos como `javascript:`.
- Ejecuciones congelan versión de los pasos para que una plantilla cambiada no altere un plan ya ejecutado. Puede resolverse con snapshots o versionado inmutable antes de ofrecer historial fuerte.

---

## 16. API y servicios (contratos funcionales)

No son endpoints irrevocables, pero definen operaciones esperadas.

```text
POST   /api/workspaces
GET    /api/workspaces/:workspaceId/dashboard
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
GET    /api/assets?projectId=&providerId=&identityId=&environmentId=&search=
POST   /api/assets
GET    /api/assets/:id
PATCH  /api/assets/:id
POST   /api/assets/import/preview
POST   /api/assets/import/commit
POST   /api/dependencies
DELETE /api/dependencies/:id
GET    /api/identities
POST   /api/identities
POST   /api/emails
POST   /api/provider-accounts
POST   /api/asset-roles
GET    /api/impact?entityType=asset&entityId=...
GET    /api/runbooks
POST   /api/runbooks/from-template
GET    /api/runbooks/:id/export.md
POST   /api/runbooks/:id/executions
PATCH  /api/runbook-executions/:id/steps/:stepId
POST   /api/migrations/from-template
GET    /api/migrations/:id/impact
GET    /api/migrations/:id/export.md
PATCH  /api/migrations/:id/steps/:stepId
```

**Contratos generales:**

- Todas las rutas requieren identidad autenticada, membership activa y autorización sobre workspace/proyecto.
- `workspaceId` no se acepta ciegamente como prueba de acceso; se comprueba sesión y membresía.
- Esquemas de entrada y salida tipados con Zod o equivalente; restricciones de tamaño, paginación, rate limits de endpoints sensibles.
- Errores consistentes y sin exponer secretos ni información de otros tenants.
- Importaciones idempotentes o con identificador de lote para evitar duplicados accidentales.
- Eventos de auditoría para creación/cambio de accesos, propietario, rol, identidad, runbook, migración o exportación sensible.

---

## 17. Stack y decisiones de ingeniería

Decisiones **cerradas** para la implementación (ver también [docs/ROADMAP.md](ROADMAP.md)):

- **Gestor de paquetes:** bun.
- **Frontend y API:** Nuxt 4, Vue 3, TypeScript, Nitro.
- **i18n:** `@nuxtjs/i18n`, locales `en` (default) y `es`, **`strategy: 'no_prefix'`** (prohibido `prefix`, `prefix_except_default`, `prefix_and_default`). El idioma se guarda en cookie; más adelante también en preferencia de usuario. `Accept-Language` solo en la primera visita sin cookie.
- **Validación:** Zod (compartir esquemas con la API cuando tenga sentido).
- **Persistencia:** PostgreSQL 16 con migraciones versionadas; **Drizzle ORM** con driver **`pg`** (`node-postgres`). No usar `postgres.js` como driver principal.
- **Auth:** **sesiones propias** en Drizzle (tabla `sessions`, token hasheado en BD; cookie HTTP-only, `Secure` en prod, `SameSite=Lax`). Contraseñas con `Bun.password` (argon2id). Reset por email (Mailpit en dev). Signup solo en instancia vacía; primer usuario = owner. MFA antes de abrir a terceros (post-Fase 1).
- **Trabajos:** al inicio cron/worker simple para recordatorios; cola con reintentos/idempotencia cuando el volumen lo justifique.
- **UI:** Tailwind CSS + **Reka UI** (primitivos headless) + iconos SVG propios en `app/components/icons/` (ver regla del repo). Sin Nuxt UI, Lucide, Font Awesome ni emoji en la UI.
- **Compose — dev (`compose.dev.yml`):** PostgreSQL + Mailpit; Nuxt en el host con `bun dev` (hot reload).
- **Compose — prod (`compose.prod.yml`):** imagen de la app (bun) + PostgreSQL + **Caddy** (HTTPS). Backups y restauración probados.
- **Emails transaccionales:** SMTP configurable; credenciales solo en entorno del servidor.
- **Datos:** backups cifrados, acceso restringido, exportación y borrado.

### Organización de carpetas sugerida

```text
app/
  pages/
  components/
  composables/
server/
  api/
  services/
  repositories/
  auth/
  jobs/
shared/
  schemas/
  types/
  constants/
  templates/
    runbooks/
    migrations/
db/
  migrations/
  seed/
tests/
  unit/
  integration/
  e2e/
docs/
  ACCESSMAP_SPEC_CURSOR.md
  ROADMAP.md
  ADR/
```

### Decisiones que conviene documentar como ADR

1. Modelo de workspace personal y agencia.
2. Diferencia entre identidad, email y cuenta de proveedor.
3. Estrategia de autorización/aislamiento multi-tenant.
4. Versionado de runbooks y migraciones.
5. Cuáles campos son seguros y cuáles son solo referencias externas.
6. Conectores externos y permisos mínimos de lectura.
7. Modelo de relaciones y análisis de impacto.

---

## 18. Seguridad y límites explícitos del producto

**Principio rector: metadata, no credenciales.**

### Nunca guardar en AccessMap

- Contraseñas, notas con passwords, tokens API, secret keys, claves SSH privadas, códigos de recuperación, códigos de transferencia de dominio, cookies de sesión, claves de firma o `.env` con secretos.
- Nunca pedir al usuario que pegue su exportación completa de Bitwarden.
- Nunca registrar en logs los valores de entrada antes de filtrar secretos.
- Nunca incluir credenciales en exportaciones, backups desprotegidos ni respuestas API.

### Sí permitir

- Nombre del ítem en Bitwarden o referencia textual («Bitwarden > Proyecto > AWS SES prod»).
- URL segura a la pantalla de administración sin parámetros sensibles.
- Nombres de variables (`AWS_REGION`, `GOOGLE_CLIENT_ID`), con clasificación. **Un client ID público no equivale a client secret**; aun así, por privacidad permitir ocultarlo en exportaciones.
- Metadatos como región, tecnología, proveedor, fecha de renovación y procedimientos.

### Riesgos y mitigaciones

- Los mapas de infraestructura son información delicada incluso sin passwords; proteger con MFA, sesiones seguras, TLS, backups cifrados y control de acceso.
- Anotar el mínimo de datos personales y permitir su eliminación/exportación conforme a normativa aplicable.
- Proteger contra XSS, SSRF a través de imports/URLs, inyección Markdown, IDOR, enumeración de workspaces y errores de autorización.
- Las integraciones futuras usan permisos mínimos, conexión opt-in, revocación y almacenaje seguro de credenciales de integración **solo si son necesarias**. Diferenciar eso de un gestor de contraseñas de usuario.
- Los scripts/documentos externos son contenido no confiable, no instrucciones para ejecutar automáticamente.
- Las operaciones con permisos y cambios sensibles requieren confirmación humana y auditoría.

---

## 19. Métricas para evaluar si el producto funciona

### Activación (personal)

- % que crea 1 proyecto y ≥5 activos.
- % que añade ≥2 identidades o direcciones de correo.
- % que registra ≥5 dependencias/roles.
- Tiempo hasta primer mapa útil.
- % que exporta o completa su primera guía.

### Uso repetido

- Usuarios que vuelven a consultar su mapa dentro de 7/30 días.
- Actualizaciones de activo/identidad tras cambios reales.
- Runbooks ejecutados/revisados.
- Migraciones planificadas y verificaciones realizadas.
- Número de vínculos «sin confirmar» resueltos.

### Negocio (más adelante)

- Conversión personal → plan de pago.
- Equipos creados e invitados aceptados.
- Retención mensual, churn y motivos.
- Agencia: clientes activos por workspace, uso de offboarding/handovers y tiempo ahorrado reportado.

**No optimizar por número de recursos sin contexto:** un inventario inflado no crea valor si no se utiliza ni se mantiene actualizado.

---

## 20. Monetización — hipótesis para validar, no precio final

- **Personal Free:** 1 workspace personal, pocos proyectos y recursos suficientes para probar; importación manual y 1–2 guías.
- **Personal Pro:** proyectos/recursos ampliados, runbooks, migraciones, exportaciones y revisiones; precio a investigar (p. ej. 5–10 €/mes).
- **Team:** usuarios, colaboración, ownership, aprobaciones y revisiones; precio a investigar (p. ej. 19–59 €/mes).
- **Agency:** clientes, permisos granulares, importación masiva, offboarding, handover y posiblemente integraciones; precio a validar por número de clientes/usuarios (p. ej. 79–249 €/mes).

**No implementar facturación en la primera fase.** Primero validar uso personal real, después utilidad en otro desarrollador/freelancer y finalmente disposición de pago. El segmento personal puede generar adopción pero no necesariamente ingresos suficientes; mantener viable el camino B2B.

---

## 21. Roadmap realista (con criterios de salida)

> Detalle por PR y dependencias: [docs/ROADMAP.md](ROADMAP.md).

**Hito «dogfood» (primero usable):** fin de **Fase 1** — inventario completo, wizard de onboarding, CSV, impacto en lista. **No** incluye runbooks ni planes de migración exportables (Fase 2–3).

### Fase 0 — Base técnica y prueba end-to-end

- [ ] `compose.dev.yml` (Postgres + Mailpit) y `compose.prod.yml` (app + Postgres + Caddy); Dockerfile con bun.
- [ ] Proyecto Nuxt 4 + Drizzle + migraciones SQL.
- [ ] Auth con sesiones propias; workspace personal automático; i18n `en`/`es` sin prefix en URL.
- [ ] Shell de navegación y componentes base (Tailwind + Reka + iconos propios).
- [ ] Tests de aislamiento multi-tenant iniciales.

**Salida:** login → workspace → proyecto → recurso en Postgres real (sin mocks persistentes).

### Fase 1 — Inventario personal útil

- [ ] CRUD proyectos, proveedores y cuentas de proveedor.
- [ ] CRUD identidades, correos y sus roles.
- [ ] CRUD recursos y enlaces de administración.
- [ ] Asociar recurso a proyecto y entorno.
- [ ] Relacionar identidades/roles con recursos.
- [ ] Dependencias entre recursos y vista de impacto en lista (sin grafo visual obligatorio).
- [ ] Filtros y búsqueda con paginación en servidor.
- [ ] Onboarding wizard de 5 pasos (sección 6).
- [ ] CSV import/export con preview, sin secretos.
- [ ] Seed **ficticio** Mini Críptico con marcadores `unverified`.

**Salida:** registrar Mini Críptico (manual, wizard o CSV) y responder las preguntas de la sección 4.4 de forma manual y trazable.

### Fase 2 — Runbooks y README

- [ ] Plantillas de setup (al menos 3).
- [ ] Generación de guía por proyecto y entorno.
- [ ] Pasos con dependencias, prerequisitos, referencias y validaciones.
- [ ] Ejecución manual de checklist e historial.
- [ ] Exportación Markdown.

**Salida:** producir README útil de incorporación a Mini Críptico sin contraseñas ni pasos inventados.

### Fase 3 — Planes de migración

- [ ] Motor de plantillas de migración.
- [ ] GitHub → Bitbucket y cambio de registrador como primeras recetas.
- [ ] Evaluación de impacto desde grafo.
- [ ] Plan con preflight, validación, rollback, estados y exportación.
- [ ] Registro de ejecución manual.

**Salida:** planes específicos de Mini Críptico que identifiquen dependencias documentadas y pendientes de comprobar.

### Fase 4 — Colaboración

- [ ] Invitaciones y membresías de equipo.
- [ ] Roles owner/admin/editor/viewer.
- [ ] Asignaciones de responsables.
- [ ] Offboarding de empleado/colaborador basado en sus roles registrados.
- [ ] Compartición deliberada de proyecto personal a equipo.
- [ ] Historial/auditoría mejorado.

**Salida:** dos usuarios colaboran sin ver información de otros workspaces.

### Fase 5 — Agencias

- [ ] Clientes, permisos por cliente/proyecto.
- [ ] Importación masiva y plantillas por vertical.
- [ ] Revisiones periódicas y tareas por cliente.
- [ ] Handover cliente-agencia con aprobación.
- [ ] Paginación y performance para cientos/miles de clientes.
- [ ] Billing, soporte y herramientas comerciales según validación.

### Fase 6 — Integraciones opt-in

Evaluar, por demanda: GitHub, Google Workspace/Cloud (según alcance), Cloudflare, AWS, DNS, repositorios y gestores externos de documentación. Una integración de login de AccessMap con Google **no** significa que tenga permisos para inspeccionar Google Ads, YouTube, Search Console o Google Cloud del usuario.

---

## 22. Casos de prueba / criterios de aceptación (Given / When / Then)

**Identidades**

- **Dado** que hay Google A y Google B, **cuando** asigno YouTube a A y Search Console a B, **entonces** el sistema los muestra separados aun si son del mismo proveedor.
- **Dado** que un correo sirve de recuperación para varias identidades, **cuando** consulto su impacto, **entonces** veo todas las relaciones etiquetadas correctamente.
- **Dado** que la identidad A tiene rol `admin` declarado sin verificar, **cuando** veo el mapa, **entonces** aparece el estado no verificado.

**Proyectos y recursos**

- **Dado** que AWS SES sirve a dos proyectos, **cuando** lo vinculo al segundo, **entonces** no se crea un duplicado automático de recurso.
- **Dado** que VPS-01 tiene dos dependencias de aplicación, **cuando** consulto su impacto, **entonces** veo ambas con tipo de relación y estado de verificación.
- **Dado** que una agencia tiene miles de activos, **cuando** filtro/busco, **entonces** el servidor pagina y limita resultados.

**Setup**

- **Dado** un proyecto con OAuth, repo y VPS, **cuando** genero setup, **entonces** el README incluye enlaces/referencias y marca datos faltantes; no inventa valores o comandos.
- **Dado** un vault reference, **cuando** exporto, **entonces** solo aparece una referencia autorizada, nunca una credencial.
- **Dado** que la plantilla cambia después de iniciar una ejecución, **cuando** reabro una ejecución anterior, **entonces** siguen visibles los pasos que esa ejecución utilizó.

**Migraciones**

- **Dado** un repo ligado a VPS por `deployed_from`, **cuando** planifico GitHub → Bitbucket, **entonces** el plan indica que revisar CI/deploy es necesario; el usuario confirma los detalles concretos.
- **Dado** un dominio relacionado con correo y Google Search Console, **cuando** planifico cambiar registrador, **entonces** el preflight recuerda verificar que DNS y correo no se vean alterados.
- **Dado** que un paso obligatorio falla, **cuando** intento cerrar la migración, **entonces** el estado no pasa a `completed` sin una resolución explícita y auditable.

**Seguridad**

- **Dado** que el usuario pertenece a workspace A, **cuando** solicita un activo de workspace B por ID, **entonces** recibe 403 o 404 sin revelar datos.
- **Dado** un CSV con una columna que parece contener tokens, **cuando** previsualizo la importación, **entonces** la columna es rechazada/redactada y se indica que debe importarse como referencia a un vault; no se conserva el secreto en logs.
- **Dado** un usuario de solo lectura, **cuando** intenta modificar un rol, **entonces** se bloquea en backend.

---

## 23. Backlog inicial en forma de historias de usuario

| ID | Prioridad | Historia | Resultado |
| --- | --- | --- | --- |
| US-001 | P0 | Como usuario quiero crear mi workspace personal automáticamente. | Entrar en la app y empezar sin configurar una empresa. |
| US-002 | P0 | Quiero crear proyectos y registrar sus servicios. | Inventario navegable por proyecto. |
| US-003 | P0 | Quiero registrar varias cuentas del mismo proveedor. | Google A y B no se mezclan. |
| US-004 | P0 | Quiero registrar mis cuatro correos y sus usos. | Vista de impacto por correo. |
| US-005 | P0 | Quiero vincular una identidad a un recurso con un rol. | Saber quién administra qué. |
| US-006 | P0 | Quiero marcar datos como no verificados. | No inventar certeza. |
| US-007 | P0 | Quiero vincular recursos entre sí. | Dependencias consultables. |
| US-008 | P0 | Quiero tener una referencia externa al vault. | Encontrar credenciales sin almacenarlas. |
| US-009 | P1 | Quiero importar CSV de mis recursos. | Onboarding de inventarios más rápido. |
| US-010 | P1 | Quiero generar un README de setup. | Incorporación reproducible. |
| US-011 | P1 | Quiero ejecutar una checklist. | Registrar avances sin modificar servicios. |
| US-012 | P1 | Quiero planear una migración GitHub → Bitbucket. | Plan con dependencias y validación. |
| US-013 | P1 | Quiero planear traslado Namecheap → Hostinger. | Plan separado de DNS y hosting. |
| US-014 | P1 | Quiero identificar qué depende de Google A. | Reducir el riesgo de una cuenta crítica. |
| US-015 | P2 | Quiero invitar a otro desarrollador. | Colaboración con roles. |
| US-016 | P2 | Quiero dar de baja a un colaborador. | Checklist de accesos y responsables. |
| US-017 | P3 | Como agencia quiero administrar clientes separados. | Escalar modelo sin duplicar. |
| US-018 | P3 | Quiero verificar parte del inventario con conectores read-only. | Menos mantenimiento manual y mejor evidencia. |

---

## 24. Preguntas abiertas (no bloquear MVP)

1. ¿El producto se llamará AccessMap? **Nombre provisional**; comprobar marca y dominio antes de comercializar.
2. **i18n:** `en` + `es`, default `en`, `no_prefix` — **cerrado**.
3. **ORM / DB:** Drizzle + `pg` — **cerrado**.
4. ¿Los workspaces personales tendrán límite de proyectos/recursos? Decidir al validar monetización.
5. ¿Se puede registrar un recurso sin proveedor conocido? **Sí**.
6. ¿Las guías podrán incluir comandos específicos de cada proyecto? **Sí, como texto documentado, sin ejecución remota MVP**.
7. ¿Importación automática desde repositorios? **No en MVP; priorizar CSV/manual y después lectura autorizada**.
8. ¿Clasificar `config_entries` como dato público/no secreto o referencia? **Sí; si hay dudas, usar referencia**.
9. ¿Automatizar transferencias de DNS, roles o servidores? **No por defecto**; requerirá una decisión de producto y permisos explícitos posteriores.
10. ¿El mismo activo puede compartirse entre workspaces? **No como acceso implícito**; exportar/copiar o mecanismo controlado futuro.
11. ¿Cómo gestionar recursos con varias cuentas de proveedor? Añadir relaciones múltiples cuando un caso real lo exija; no forzar un único login propietario.
12. ¿Las dependencias estarán totalmente verificadas? No. El modelo debe soportar evidencias parciales y datos declarados.

---

## 25. Referencias oficiales a contrastar al crear plantillas o integraciones

Estas fuentes sirven como punto de partida; **consultar la versión actual antes de automatizar o publicar instrucciones**.

- Google OAuth / Google Identity Services: https://developers.google.com/identity/protocols/oauth2 y https://developers.google.com/identity/openid-connect/openid-connect
- Crear OAuth client y URIs: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
- YouTube, permisos de canal: https://support.google.com/youtube/answer/9481328
- Search Console, propietarios/usuarios: https://support.google.com/webmasters/answer/7687615
- Google Ads, acceso: https://support.google.com/google-ads/answer/6372672
- Google Analytics, permisos: https://support.google.com/analytics/answer/9305788
- Bitbucket, importación de GitHub: https://support.atlassian.com/bitbucket-cloud/docs/import-a-repository-from-github-or-gitlab/
- GitHub, transferencias dentro de GitHub (distintas de GitHub → Bitbucket): https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository
- ICANN, transferencias de dominios: https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en/
- Cloudflare DNS / nameservers: https://developers.cloudflare.com/dns/nameservers/update-nameservers/
- Amazon SES, identidades/regiones: https://docs.aws.amazon.com/ses/latest/dg/verify-addresses-and-domains.html y https://docs.aws.amazon.com/ses/latest/dg/regions.html

---

## 26. Definición de «hecho» (por fase)

### 26.A — Dogfood inventario (fin de Fase 1; criterio principal del MVP)

Listo para inventariar Mini Críptico en una base de datos real cuando:

- [ ] Entro, se crea mi workspace personal y puedo crear Mini Críptico.
- [ ] Registro Google A y Google B como cuentas/identidades distintas y cuatro emails con distintos usos.
- [ ] Registro sin mezclar los activos de Google OAuth, YouTube, Google Ads y Search Console.
- [ ] Registro GitHub, dos VPS, Namecheap, OpenShip, Cloudflare storage y AWS SES como recursos concretos (sin fingir que sus detalles están verificados).
- [ ] Vinculo activos a proyectos y entornos y asigno responsables.
- [ ] Veo qué servicios dependen de cada cuenta/identidad y qué activos se ven afectados al cambiar uno (vista de impacto en lista).
- [ ] Nunca escribo secretos en AccessMap: solo referencias a Bitwarden.
- [ ] Un segundo workspace no puede acceder a mis datos mediante URLs o API.
- [ ] Hay tests de autorización, migraciones, seed ficticio y documentación de Compose dev/prod.

### 26.B — Producto personal completo (Fase 2 + Fase 3)

Además de 26.A:

- [ ] Genero un README de setup útil y exportable (Fase 2).
- [ ] Genero dos planes de migración específicos con advertencias, validaciones, rollback y estados (Fase 3).
- [ ] Backups probados en el despliegue objetivo.

**Regla de producto final:** AccessMap debe recordar la estructura de un proyecto y explicarla en el momento adecuado. Debe dar confianza, no una falsa sensación de automatización.

---

## 27. Prompt sugerido para el primer mensaje en Cursor

```text
Lee docs/ACCESSMAP_SPEC_CURSOR.md y docs/ROADMAP.md. Construye AccessMap desde cero.
Implementa solo Fase 0 y Fase 1 hasta que se pida avanzar.

Stack cerrado: Nuxt 4, bun, Drizzle (pg), sesiones propias, i18n en/es sin prefix en URL,
Tailwind + Reka UI; compose.dev (Postgres+Mailpit) y compose.prod (app+Postgres+Caddy).

Orden sugerido:
1. Compose + Drizzle schema + migraciones.
2. Auth (signup solo si no hay users), workspace personal, i18n.
3. Vertical slice: proyecto + asset.
4. Inventario CRUD, dependencias, impacto en lista.
5. Wizard §6 + CSV import/export.
6. Seed ficticio Mini Críptico + tests multi-tenant.

Restricciones: metadata, no credenciales; sin integraciones externas; sin pantallas vacías.
Criterio de dogfood: sección 4.4 y 26.A.
```

**Fin de la especificación v0.2.**
