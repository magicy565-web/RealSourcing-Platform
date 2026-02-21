# v0.dev UI 控件生成指南：RealSourcing 黑紫色主题

**目标**：使用 v0.dev 生成一套基于 React + Tailwind CSS + shadcn/ui 的“黑紫色霓虹”风格 UI 控件库。直接将以下提示词复制到 v0.dev 中即可。

**核心设计语言**：
- **背景**: 深黑曜石/碳黑 (`#0D0D14`)
- **主色**: 电光紫 (`#7C3AED`)
- **强调色**: 霓虹紫/品红 (`#A855F7`)
- **文本**: 亮白/浅灰 (`#F8FAFC`, `#94A3B8`)
- **风格**: 玻璃拟态 (Glassmorphism), 霓虹光晕 (Neon Glow), 锐利线条, 高对比度
- **图标库**: `lucide-react`

---

### 1. 核心按钮 (Primary Button)

**🎯 目标**：生成一个带霓虹光晕和悬停效果的主按钮。

**✍️ v0.dev 提示词**:
```
A primary button component for a dark-themed SaaS platform. Use React, TypeScript, and Tailwind CSS, based on shadcn/ui's Button component.

The button should have a solid background of electric violet (#7C3AED). On hover, it should brighten slightly and have a more pronounced violet shadow or glow effect. The text should be white and bold.

Create variants for different sizes (default, sm, lg, icon). The component should use `cva` for variants.

When used, it should look like this: `<Button>立即注册</Button>`

Here is the desired style in detail:
- **Default State**: Solid `#7C3AED` background, white text, subtle violet box-shadow (`0 0 10px #7C3AED`).
- **Hover State**: Background brightens to `#8B5CF6`, shadow expands (`0 0 20px #7C3AED`). Add a `transform: scale(1.02)` effect.
- **Active State**: `transform: scale(0.98)`.
- **Disabled State**: Grayed out (`#374151`), no glow, text is `#9CA3AF`.
- **Icon Support**: The button should seamlessly support a `lucide-react` icon on the left or right.
```

---

### 2. 玻璃拟态卡片 (Glassmorphism Card)

**🎯 目标**：生成一个半透明、带发光边框的卡片容器。

**✍️ v0.dev 提示词**:
```
A glassmorphism card component for a futuristic dark UI. Use React, TypeScript, and Tailwind CSS, based on shadcn/ui's Card component.

The card should be placed on a dark background with a subtle gradient (e.g., from #0D0D14 to #111827).

The card itself should have:
1.  A semi-transparent background: `bg-white/5` or `bg-black/20`.
2.  A frosted glass effect using `backdrop-blur-lg`.
3.  A 1px border with a very subtle white or light gray color: `border border-white/10`.
4.  **On hover**: A faint, glowing border in electric violet (`#7C3AED`) should appear around the card. This can be achieved by animating a pseudo-element or a gradient border.
5.  Rounded corners (`rounded-xl` or `rounded-2xl`).

Show an example of the card containing a title and some body text. The card should have `CardHeader`, `CardContent`, and `CardFooter` components.
```

---

### 3. 霓虹输入框 (Neon Input Field)

**🎯 目标**：生成一个在聚焦时边缘发光的输入框。

**✍️ v0.dev 提示词**:
```
An input field component for a dark, cyberpunk-themed UI. Use React, TypeScript, and Tailwind CSS, based on shadcn/ui's Input component.

The input should have a dark, slightly transparent background (`bg-black/30`). The border should be a muted gray (`#4B5563`).

The key feature is the focus state:
- **On Focus**: The border color should transition to a glowing electric violet (`#7C3AED`). The component should also have a violet `ring` or `box-shadow` to create a neon glow effect (`ring-2 ring-violet-500/50`).

Show the input field with a `lucide-react` icon (like `Mail`) inside on the left. The placeholder text should be a muted gray.
```

---

### 4. 状态徽章 (Status Badge)

**🎯 目标**：生成用于表示“直播中”、“即将开始”、“已结束”等状态的徽章。

**✍️ v0.dev 提示词**:
```
A badge component using React, TypeScript, and Tailwind CSS, based on shadcn/ui's Badge. It needs to support different semantic variants for a webinar platform.

Create the following variants using `cva`:
1.  **live**: A bright red background (`#EF4444`) with white text. It should include a small, pulsing red dot to its left to indicate a live status.
2.  **upcoming**: A solid electric violet background (`#7C3AED`) with white text.
3.  **past**: A muted gray background (`#374151`) with light gray text (`#9CA3AF`).
4.  **verified**: An emerald green background (`#10B981`) with white text, including a checkmark icon from `lucide-react`.

All badges should be small, pill-shaped (`rounded-full`), and have bold, uppercase text.
```

---

### 5. 完整登录页面 (Full Login Page)

**🎯 目标**：如果您想一次性消耗更多 credit 生成完整页面，可以使用这个。

**✍️ v0.dev 提示词**:
```
Create a login page for a futuristic B2B SaaS platform called "RealSourcing". The design should be dark, professional, and use a "cyberpunk-meets-enterprise" aesthetic.

**Layout**: A two-column split screen.

**Left Column (40% width)**:
- Background: A vertical gradient from deep black (#0D0D14) to electric violet (#4C1D95).
- Content: Vertically centered.
  - Main Title: "连接真实工厂，开启高效采购新时代" in large, bold white font.
  - Bullet Points: Use `lucide-react` check icons next to key features like "AI 智能匹配", "1:1 视频会议", "真实工厂直连".
  - Testimonial: At the bottom, a small glassmorphism card showing a 5-star rating and a user quote.

**Right Column (60% width)**:
- Background: Solid charcoal black (#111827).
- Content: A centered form container.
  - Title: "欢迎回来" (Welcome Back).
  - Form Fields: Inputs for "邮箱" and "密码" with the neon glow effect on focus (as designed previously).
  - Primary CTA Button: A full-width, glowing violet button with text "登录".
  - Social Login: Buttons for Google and LinkedIn, styled as outline buttons with a subtle gray border.
  - Footer Link: "还没有账号? 立即注册" with the text "立即注册" in violet.

Use React, TypeScript, and Tailwind CSS. All components should be based on shadcn/ui.
```
