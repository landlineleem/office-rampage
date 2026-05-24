# Sprite generation guide — ChatGPT / DALL-E 3

You're going to generate character sprites using ChatGPT (DALL-E 3), download them as PNGs, and drop them into this repo. The game already knows how to load them when present and falls back to the procedural placeholder when missing — so you can ship sprites one at a time and see results immediately.

---

## Where to drop the files

Put PNGs in:

```
/home/vpliam/office-rampage/public/assets/sprites/
```

After dropping any new file, run `npm run dev` (or push to deploy) and reload — the new sprite replaces the procedural one automatically.

---

## Sprite list

| File name | Pose | Size | Notes |
|---|---|---|---|
| `player_idle.png` | Standing still, side view | 200x350 | Most important — set the character design here first |
| `player_walk_0.png` | Walking, right leg forward | 200x350 | Same character, walking pose 1 |
| `player_walk_1.png` | Walking, left leg forward | 200x350 | Same character, walking pose 2 |
| `player_jump.png` | Mid-air, knees tucked up | 200x350 | Same character, jumping |
| `guard_idle.png` | Security guard standing | 200x350 | Different character — see prompts below |
| `guard_walk_0.png` | Guard walking, right leg | 200x350 | Same guard |
| `guard_walk_1.png` | Guard walking, left leg | 200x350 | Same guard |

> Skip `player_slide.png`, `player_fall.png` for now — they're harder to make consistent. Procedural fallback handles them, and we'll tackle them once the standing/walking look is locked in.
>
> The aiming arm + pistol is **always procedural** because it rotates with your mouse. AI sprites can't do that.

---

## ChatGPT / DALL-E 3 workflow

DALL-E 3 doesn't have a "character reference" feature, so we lock the look by **reusing the exact same descriptive prefix** every time. Below is the prefix, then per-pose suffixes.

### Step 1: The base character prompt (the "character bible")

Paste this into ChatGPT first to lock the look in your session:

```
I'm making a side-scrolling video game and need character sprites that look
consistent across multiple poses. Please draw them in this style for every
image I ask for in this conversation:

CHARACTER: A 30-something office worker man, side-profile view (camera at his
right side, body facing right), full body visible from head to toe. Light
brown hair, neatly combed. Light skin. Wearing a crisp white dress shirt
with the sleeves rolled up, a slim red tie, dark grey slacks with a leather
belt, and black dress shoes.

STYLE: Stylized 3D-rendered look, similar to the game "My Friend Pedro" —
clean shading with soft directional lighting from the upper left, slightly
cartoony proportions (head slightly larger than realistic), simplified
geometric forms, subtle ambient occlusion. NOT pixel art. NOT photorealistic.
NOT anime. Think modern indie game character — like a Pixar short rendered
in a more stylized, lower-fidelity way.

FORMAT REQUIREMENTS (critical):
- Solid pure-white background (#FFFFFF) — I'll remove it later
- Character takes up most of the frame, no extra empty space on sides
- Full body in frame, no cropping
- Side profile only — no 3/4 view, no front view
- No shadow on the ground
- Output as a tall portrait image (roughly 1024x1792 if you can)

Confirm you understand and I'll start asking for individual poses.
```

Wait for ChatGPT to acknowledge, then request poses one by one.

### Step 2: Per-pose prompts

Send each prompt as its own message:

**`player_idle.png`** — first one is most important, this defines the character:

```
Pose 1: STANDING IDLE. Arms relaxed at his sides. Weight on both feet,
shoulders slightly relaxed. Calm, ready expression. Looking straight forward.
```

**`player_walk_0.png`**:

```
Pose 2: WALKING — right leg forward. Same character as before, mid-stride
with his right leg planted forward and his left leg trailing behind. Both
arms swinging naturally with the gait (left arm forward to match the right
leg). Slight forward lean. Determined expression, eyes ahead.
```

**`player_walk_1.png`**:

```
Pose 3: WALKING — left leg forward. Same character. Mirror of the previous
pose: left leg planted forward, right leg trailing. Right arm forward, left
arm back. Same forward lean and expression.
```

**`player_jump.png`**:

```
Pose 4: JUMPING. Same character, mid-air, both knees tucked up toward his
chest, arms slightly out for balance. Shirt and tie can flutter a little.
Looking forward.
```

### Step 3: Security guard prompts

The guard is a DIFFERENT character, so reset your context first by pasting another character bible:

```
Now I need a SECOND character — different from the office worker. Same style
and format requirements (side-profile, solid white background, MFP-inspired
stylized 3D-rendered look, full body in frame).

NEW CHARACTER: A 40-something male security guard. Stocky build, broad
shoulders. Tan skin, dark hair under a navy-blue uniform cap with a black
brim. Thick brown mustache. Wearing a navy-blue short-sleeve uniform shirt
with a gold star badge on the left chest pocket, black uniform pants, black
duty belt with a holstered pistol on his right hip, and black combat boots.
Slightly grumpy expression.

Confirm and I'll request poses.
```

Then:

**`guard_idle.png`**:

```
Guard pose 1: STANDING IDLE. Hands on his belt buckle, alert posture,
looking straight forward. Slight scowl.
```

**`guard_walk_0.png`** and **`guard_walk_1.png`**:

```
Guard pose 2: WALKING — right leg forward. Same guard as before, mid-stride,
walking forward purposefully. Right hand resting on the grip of his
holstered pistol (gun stays in holster). Left arm swinging forward to match.
```

```
Guard pose 3: WALKING — left leg forward. Same guard. Mirror of the
previous pose.
```

---

## Step 4: Background removal

DALL-E gives you a JPEG with a white background. Convert each to a PNG with transparent background:

**Option A (easiest):** Upload to https://www.remove.bg — drop the image, download the PNG. Free up to 50 images/month, way more than we need.

**Option B:** Use https://www.photopea.com (free Photoshop clone in browser) — open the image, magic wand the white background, delete, export as PNG.

**Option C:** If you have macOS Preview, use the Instant Alpha tool on the background.

---

## Step 5: Save to the project

Save each cleaned PNG with the exact file name from the table above into:

```
/home/vpliam/office-rampage/public/assets/sprites/
```

For example: `/home/vpliam/office-rampage/public/assets/sprites/player_idle.png`

---

## Step 6: See it in the game

Push to deploy (or run `npm run dev` locally) and reload — the sprite is now in the game. Procedural fallbacks stay in place for any sprite that hasn't been generated yet.

---

## What I do next

Once you've dropped the first sprite (probably `player_idle.png`), tell me and I'll:
1. Tune the in-game character size so it reads well at the camera distance
2. Recompute hitbox offsets so the body collider lines up with the new sprite
3. Tweak the shoulder position so the procedural gun arm attaches in the right place
4. Iterate on prompts with you if the result isn't quite right

We'll do the player first, see if you like it, then guards. One step at a time.
