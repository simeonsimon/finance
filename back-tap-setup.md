# Double-tap the back of your iPhone to log a spend

Tap the back of your phone twice → three quick questions → the spend is in the
tracker. The app never opens.

```
double tap
   ↓
¿Cuánto?        →  4,50
¿Con qué?       →  💵 Efectivo
¿En qué?        →  🍔 Comida
   ↓
✓ Apuntado
```

The entry goes **straight into your balance**. Next time you open the tracker
it's already there, with a note on Inicio saying it arrived via the back tap.

> **Written for a UK English iPhone.** Every action name below is what you'll
> actually see in the Shortcuts app.

---

## Two kinds of text in this guide

This matters — getting it wrong is the one thing that will silently break it.

| | Example | Rule |
|---|---|---|
| **Must match the app exactly** | `Efectivo`, `🍔 Comida` | The tracker matches these against its own Spanish labels. **Do not translate them.** Emojis, capitals and accents are ignored, so `🍔 Comida`, `comida` and `COMIDA` all work equally well. |
| **Yours to change** | the prompts `¿Cuánto?`, the shortcut's name | Purely what you see on screen. Put them in English if you prefer. |

Both failure modes were tested, and they are not equally obvious:

- **A category it doesn't recognise** (`🍔 Food`) becomes **Otros**. Annoying,
  but you can see it and fix it.
- **A payment method it doesn't recognise** (`💳 My Card`) is worse: it
  *silently* goes to your default method. Nothing looks wrong, but the wrong
  card's balance quietly drifts. This is the one to get right.

---

## Before you start

You already have all of this from the Apple Pay automation — nothing new to create:

| What | Value |
|---|---|
| Inbox repo | `simeonsimon/finance-inbox` (private) |
| Token | The same fine-grained PAT (Contents: Read and write) |
| Folder | `pending/` inside that repo |

### Getting hold of the token again

**GitHub will not show it to you a second time.** A personal access token is
displayed once, when you create it, and stored hashed after that — there is no
page on github.com that can reveal it. So don't go looking; use one of these
instead, in order of least hassle:

1. **From the tracker.** **Ajustes** → the Apple Pay card → **Copiar token**.
   (If copying is blocked, tap **Ver** and long-press the token to copy it by
   hand.) The field is a password box, and iOS refuses to copy from those —
   that's why those two buttons exist.
2. **From your existing Apple Pay automation.** Shortcuts → **Automation** →
   open it → the **Get Contents of URL** action → tap the `Authorization`
   header value. It reads `Bearer github_pat_…`; copy everything after
   `Bearer `. This is plain text, so it always works.
3. **Make a new one.** github.com → Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → the existing one →
   **Regenerate**. You get a fresh value shown once.
   **If you do this, the old token stops working immediately** — you must
   paste the new one into *both* the tracker's Ajustes *and* the Authorization
   header of your existing Apple Pay automation, or Apple Pay logging silently
   breaks.

> **Careful:** the token gets typed inside the shortcut. Don't share the
> shortcut with anyone — shared shortcuts include the text of every action.

---

## Building the shortcut

Open **Shortcuts** → **+** → add these 13 actions **in this order** (plus a
14th that's optional but worth it). Name it `Log spend`.

### 1 — Ask for Input
Search for **"Ask for Input"**.
- Prompt: `¿Cuánto?`
- Input Type: **Number**

### 2 — Set Variable
Search for **"Set Variable"**.
- Variable name: `importe`
- Input: the **Provided Input** token

### 3 — List
Search for **"List"**. Add one item per payment method, **spelled exactly as
they are in the tracker**:

```
💵 Efectivo
💳 Mi Tarjeta
💳 Tarjeta Tía
```

### 4 — Choose from List
Search for **"Choose from List"**.
- Prompt: `¿Con qué?`

### 5 — Set Variable
- Variable name: `metodo`
- Input: the **Chosen Item** token

### 6 — List
Another **List**, this time the categories. These ten are the ones the app
understands — again, don't translate them:

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

Keep only the five or six you actually use — a shorter list means a faster
tap. Anything the app doesn't recognise becomes *Otros*.

### 7 — Choose from List
- Prompt: `¿En qué?`

### 8 — Set Variable
- Variable name: `categoria`
- Input: the **Chosen Item** token

### 9 — Text  ← the movement itself

Type this line. Where it says **[insert X]**, don't type brackets or the word:
insert the variable from the keyboard's variable bar, on its own, with nothing
wrapped around it.

```
{"amount":"[insert importe]","payment":"[insert metodo]","category":"[insert categoria]","auto":true}
```

The braces `{ }` and the quote marks `"` **are** typed — they're part of the
JSON. It must end up as one single line with no line breaks.

### 10 — Base64 Encode
Search for **"Base64 Encode"**. Make sure it says *Encode*, not *Decode*.
- Input: the output of step 9

**Tap "Show More" and set `Line Breaks` (it may read `Line Length`) to `None`.**
This is not optional — see [trap 1](#the-traps).

### 11 — Text  ← the request body

A second **Text** action:

```
{"message":"tap","content":"[insert the output of step 10]"}
```

Again: braces and quotes are typed, the token is inserted on its own.

### 12 — Format Date
Search for **"Format Date"**.
- Date: insert the **Current Date** token. **Don't type anything here** —
  see [trap 2](#the-traps).
- Date Format: **Custom**
- Custom Format String: `yyyyMMdd-HHmmssSSS`

> **Set the format on the action, not on the token.** Tapping the *Current
> Date* token opens its own sheet that also has a Date Format field. Setting a
> format *there* turns the date into plain text, and this action then fails —
> or, if that field is left blank, it silently produces an empty filename and
> the spend vanishes with no error. This one has bitten before: leave the
> token bare and use the action's own `›` chevron.

### 13 — Get Contents of URL

**URL** — type this, then insert the token from step 12 immediately before
`.json`, with no brackets or braces around it:

```
https://api.github.com/repos/simeonsimon/finance-inbox/contents/pending/tap-[insert step 12].json
```

Tap **"Show More"** and fill in:

| Field | Value |
|---|---|
| Method | `PUT` |
| Header 1 · key | `Authorization` |
| Header 1 · value | `Bearer ` + your token (note the space after Bearer) |
| Header 2 · key | `Accept` |
| Header 2 · value | `application/vnd.github+json` |
| Request Body | **File** |
| File | the output of **step 11** |

Request Body must be **File**, not JSON — see [trap 4](#the-traps).

Once you've typed the second header, **go back and check the first one**.
They overwrite each other astonishingly easily — see [trap 3](#the-traps).

### 14 — Confirm it worked *(recommended)*

Without this, a failed upload is silent and the spend is simply lost.

- **If** → the *Contents of URL* token → **contains** → `commit`
  - **Show Notification**: `✓ Apuntado`
- **Otherwise**
  - **Show Notification**: `✗ No se pudo apuntar`

---

## Turning on the back tap

**Settings** → **Accessibility** → **Touch** → scroll to the bottom →
**Back Tap** → **Double Tap** → choose `Log spend`.

Notes:
- Works through a case unless it's very thick.
- It fires by accident now and then — in a pocket, or putting the phone down
  on a table. No harm done: the first thing that appears is the *¿Cuánto?*
  prompt, and cancelling logs nothing.
- If it triggers too often, use **Triple Tap** instead.

---

## The traps

The ones that came up building the Apple Pay shortcut, plus two specific to
this one. If something doesn't work, check here **before** changing anything
else:

| # | Symptom | Cause | Fix |
|---|---|---|---|
| 1 | `content is not valid Base64` | iOS breaks Base64 into 76-character lines | Step 10 → Show More → **Line Breaks: None** |
| 2 | `couldn't convert from Text to Date` | You typed the date by hand in step 12 | Delete it and insert the **Current Date** token |
| 3 | `401 Bad credentials` | Typing the 2nd header overwrote the 1st | Check `Authorization` is still intact, with `Bearer ` in front |
| 4 | `422 content, message weren't supplied` | You used the Request Body JSON field builder | Request Body = **File**, pointing at the Text from step 11 |
| 5 | The spend never shows up | You wrapped a token in braces, so the file was named `tap-{...}.json` | In the URL the token goes **on its own**, no `{ }` and no `[ ]` |
| 6 | It logs, but on the wrong card | A method name in step 3 doesn't match the tracker | Copy the labels exactly from **Ajustes → payment methods** |
| 7 | Nothing happens, no error at all | A Custom date format was set on the *Current Date token* rather than on the Format Date action, so the filename came out empty | Clear the token, re-insert a bare **Current Date**, set Custom only on the action |

---

## Testing it

1. Double tap → enter `1` → pick a method → pick a category.
2. Wait for `✓ Apuntado`.
3. Open the tracker (close and reopen it if it was already open).
4. Inicio should show **✓ 1 movimiento desde el iPhone**, with the €1 spend
   in the list.
5. Swipe it away in **Movs.** and you're done.

If step 4 doesn't happen: in the tracker's **Ajustes**, tap the test-connection
button. If it reports OK, the problem is in the shortcut — work through the
traps table. If it doesn't, it's the token.

---

## Details

- **What gets sent:** a small JSON with the amount, method, category and
  `auto:true`. That `auto:true` flag is what tells the tracker "this one is
  already decided, don't ask me" — which is why it posts straight to your
  balance instead of joining the *Por confirmar* queue. Apple Pay payments
  don't carry the flag, so they still go through the queue as before.
- **It needs a connection** at the moment you tap. If there isn't one you'll
  get `✗ No se pudo apuntar` and you'll have to enter it by hand.
- **Description:** since nothing asks for one, the entry is saved under the
  category's name ("Comida y snacks"). If you'd rather name them, add one more
  **Ask for Input** (`¿Qué era?`) and drop its token into step 9 like this:
  `...,"merchant":"[insert it]",...`
- **Duplicates:** if deleting the file from the repo fails, the tracker
  remembers which ones it already processed and won't log them twice.
