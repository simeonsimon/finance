# Doble toque para apuntar un gasto

Tocar dos veces la parte de atrás del iPhone → tres preguntas → el gasto ya está
en el tracker. Sin abrir la app.

```
doble toque
   ↓
¿Cuánto?        →  4,50
¿Con qué?       →  💵 Efectivo
¿En qué?        →  🍔 Comida
   ↓
✓ Apuntado
```

El movimiento entra **solo** en el balance: la próxima vez que abras el tracker
ya está ahí, con un aviso en Inicio de que ha entrado por el doble toque.

---

## Antes de empezar

Ya tienes todo esto montado de la automatización de Apple Pay, no hay que
crear nada nuevo:

| Qué | Valor |
|---|---|
| Repo buzón | `simeonsimon/finance-inbox` (privado) |
| Token | El mismo *fine-grained PAT* de siempre (permiso Contents: Read and write) |
| Carpeta | `pending/` dentro de ese repo |

Si no te acuerdas del token, en el tracker está guardado en **Ajustes**. Cópialo
de ahí antes de empezar; lo vas a necesitar en el paso 13.

> **Ojo:** el token va escrito dentro del Atajo. No compartas el Atajo con nadie
> (los Atajos compartidos incluyen el texto de sus acciones).

---

## El Atajo, acción por acción

Abre **Atajos** → **+** → añade estas 13 acciones **en este orden**.
Ponle de nombre `Apuntar gasto`.

### 1 — Pedir entrada
Busca **"Pedir entrada"**.
- Pregunta: `¿Cuánto?`
- Tipo de entrada: **Número**

### 2 — Establecer variable
Busca **"Establecer variable"**.
- Nombre: `importe`
- Valor: la pastilla **Entrada proporcionada**

### 3 — Lista
Busca **"Lista"**. Añade un elemento por cada método de pago, escritos
**igual que en el tracker** (los emojis dan igual, la app los ignora):

```
💵 Efectivo
💳 Mi Tarjeta
💳 Tarjeta Tía
```

### 4 — Elegir de la lista
Busca **"Elegir de la lista"**.
- Pregunta: `¿Con qué?`

### 5 — Establecer variable
- Nombre: `metodo`
- Valor: la pastilla **Elemento elegido**

### 6 — Lista
Otra **Lista**, ahora con las categorías. Estas son las diez que entiende la app:

```
🍔 Comida
🚌 Transporte
🎮 Ocio
👕 Ropa
📱 Tecnología
💊 Cuidado personal
📚 Material escolar
🎧 Suscripciones
⚽ Deporte y hobbies
🛒 Otros
```

Puedes dejar solo las 5 o 6 que uses de verdad — cuanto más corta la lista,
más rápido eliges. Lo que no reconozca cae en *Otros*.

### 7 — Elegir de la lista
- Pregunta: `¿En qué?`

### 8 — Establecer variable
- Nombre: `categoria`
- Valor: la pastilla **Elemento elegido**

### 9 — Texto  ← el JSON del movimiento

Escribe esta línea. Donde pone **[pastilla X]** no escribas corchetes ni el
nombre: inserta la variable desde el teclado de variables, sola, sin nada
alrededor.

```
{"amount":"[pastilla importe]","payment":"[pastilla metodo]","category":"[pastilla categoria]","auto":true}
```

Las llaves `{ }` y las comillas `"` **sí** se escriben, son parte del JSON.
Debe quedarte una sola línea, sin saltos.

### 10 — Codificar en Base64
Busca **"Codificar"** → asegúrate de que dice *Codificar* (no Descodificar).
- Entrada: la salida del paso 9

**Toca "Mostrar más" y pon `Longitud de línea` → `Ninguna`.**
Esto es obligatorio. Ver [trampa 1](#las-5-trampas).

### 11 — Texto  ← el cuerpo de la petición

Otra acción **Texto**:

```
{"message":"tap","content":"[pastilla del paso 10]"}
```

Otra vez: llaves y comillas se escriben, la pastilla se inserta sola.

### 12 — Formato de fecha
Busca **"Formato de fecha"**.
- Fecha: inserta la pastilla **Fecha actual**. **No escribas texto aquí.**
  Ver [trampa 2](#las-5-trampas).
- Formato: **Personalizado**
- Cadena de formato: `yyyyMMdd-HHmmssSSS`

### 13 — Obtener contenido de URL

**URL** — escribe esto y luego inserta la pastilla del paso 12 justo antes
de `.json`, sin corchetes ni llaves alrededor:

```
https://api.github.com/repos/simeonsimon/finance-inbox/contents/pending/tap-[pastilla paso 12].json
```

Toca **"Mostrar más"** y rellena:

| Campo | Valor |
|---|---|
| Método | `PUT` |
| Cabecera 1 · clave | `Authorization` |
| Cabecera 1 · valor | `Bearer ` + tu token (con un espacio después de Bearer) |
| Cabecera 2 · clave | `Accept` |
| Cabecera 2 · valor | `application/vnd.github+json` |
| Cuerpo de la petición | **Archivo** |
| Archivo | la salida del **paso 11** |

**Cuerpo de la petición = Archivo**, no JSON. Ver [trampa 4](#las-5-trampas).

Cuando termines de escribir las dos cabeceras, **vuelve a mirar la primera**:
se pisan entre ellas con una facilidad increíble. Ver [trampa 3](#las-5-trampas).

### 14 — Aviso de que ha ido bien *(recomendado)*

Sin esto, si falla no te enteras y el gasto se pierde.

- **Si** → la pastilla *Contenidos de la URL* → **contiene** → `commit`
  - **Mostrar notificación**: `✓ Apuntado`
- **Si no**
  - **Mostrar notificación**: `✗ No se pudo apuntar`

---

## Activar el doble toque

**Ajustes** → **Accesibilidad** → **Tocar** → baja del todo → **Tocar atrás**
→ **Doble toque** → elige `Apuntar gasto`.

Notas:
- Funciona con funda, salvo que sea muy gruesa.
- Se dispara solo de vez en cuando (en el bolsillo, al dejar el móvil en la
  mesa). No pasa nada: lo primero que sale es la pregunta *¿Cuánto?*, le das a
  cancelar y no se apunta nada.
- Si se dispara demasiado, usa **Triple toque** en vez de doble.

---

## Las 5 trampas

Las mismas cinco que aparecieron montando lo de Apple Pay. Si algo no funciona,
mira aquí **antes** de tocar nada más:

| # | Síntoma | Causa | Arreglo |
|---|---|---|---|
| 1 | `content is not valid Base64` | iOS parte el Base64 en líneas de 76 caracteres | Paso 10 → Mostrar más → **Longitud de línea: Ninguna** |
| 2 | `no se pudo convertir de Texto a Fecha` | Escribiste la fecha a mano en el paso 12 | Borra y mete la **pastilla** *Fecha actual* |
| 3 | `401 Bad credentials` | Al escribir la 2ª cabecera se sobrescribió la 1ª | Revisa que `Authorization` siga entero, con el `Bearer ` delante |
| 4 | `422 content, message weren't supplied` | Usaste el constructor de JSON del campo Cuerpo | Cuerpo = **Archivo** apuntando al Texto del paso 11 |
| 5 | El gasto no aparece nunca | Escribiste llaves alrededor de una pastilla y el archivo se llamó `tap-{...}.json` | En la URL, la pastilla va **sola**, sin `{ }` ni `[ ]` |

---

## Comprobar que funciona

1. Doble toque → mete `1` → un método → una categoría.
2. Espera el `✓ Apuntado`.
3. Abre el tracker (o ciérralo y ábrelo si ya estaba abierto).
4. En Inicio debe salir **✓ 1 movimiento desde el iPhone** y el gasto de 1 €
   en la lista.
5. Bórralo deslizando en **Movs.** y ya está probado.

Si el paso 4 no pasa: en **Ajustes** del tracker, toca el botón de probar
conexión. Si dice que va bien, el problema está en el Atajo (mira la tabla de
trampas). Si dice que no, es el token.

---

## Detalles

- **Qué manda el Atajo:** un JSON con importe, método, categoría y `auto:true`.
  Ese `auto:true` es lo que le dice al tracker "esto ya viene decidido, no me
  preguntes" — por eso entra solo en vez de ir a la cola *Por confirmar*.
  Los pagos de Apple Pay no lo llevan, y siguen pasando por la cola.
- **No hace falta internet en el momento**, pero casi: el Atajo necesita
  conexión para el PUT. Si no la hay, sale `✗ No se pudo apuntar` y toca
  apuntarlo a mano.
- **Descripción:** como no se pregunta, el movimiento se guarda con el nombre de
  la categoría ("Comida y snacks"). Si prefieres ponerle nombre, añade una
  **Pedir entrada** más (`¿Qué era?`) y mete su pastilla en el paso 9 así:
  `...,"merchant":"[pastilla]",...`
- **Duplicados:** si el borrado del archivo falla, el tracker se acuerda de los
  que ya procesó y no los vuelve a apuntar.
