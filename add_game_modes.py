import re

with open('underground.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add G properties for gameMode and laws
g_target = """  toolMode: 'select',
  placingRoom: null,
  hoverCell: { c: 0, r: 0 },"""

g_replacement = """  toolMode: 'select',
  gameMode: 'democracy', // 'democracy' (heroes vote & build) | 'overseer' (dictator) | 'anarchy'
  laws: {
    rationing: 'standard', // 'strict' (0.7x food) | 'standard' (1.0x) | 'abundant' (1.4x food, +morale)
    curfew: true,          // true: silence at night, +10 defense | false: free movement
    laborDuty: 'voluntary', // 'voluntary' (normal) | 'mandatory' (+35% work speed, -morale)
    quarantine: 'strict',  // 'strict' (0% infection risk) | 'open' (fast entry)
    childSchool: true      // true (+morale, education) | false (+stone, child labor)
  },
  lastCouncilDay: 0,
  placingRoom: null,
  hoverCell: { c: 0, r: 0 },"""

assert g_target in text, "g_target missing"
text = text.replace(g_target, g_replacement, 1)

# 2. Add Game Mode Button in top floating controls / sidebar
mode_btn_target = """      <button class="flt-btn" onclick="openChaptersModal()" style="padding: 4px 8px; font-size: 11px; background: #2a2b30; color: var(--accent-gold); border: 1px solid #444; border-radius: 4px; font-weight: bold; cursor: pointer;">⏳ ГЛАВЫ (0–30 ЛЕТ) ▼</button>"""

mode_btn_replacement = """      <button class="flt-btn" onclick="openChaptersModal()" style="padding: 4px 6px; font-size: 10px; background: #2a2b30; color: var(--accent-gold); border: 1px solid #444; border-radius: 4px; font-weight: bold; cursor: pointer;">⏳ ГЛАВЫ ▼</button>
      <button class="flt-btn" id="btn-mode-indicator" onclick="openGameModeModal()" style="padding: 4px 8px; font-size: 10px; background: #16241a; color: #2ecc71; border: 1px solid #27ae60; border-radius: 4px; font-weight: bold; cursor: pointer;">🏛️ ДЕМОКРАТИЯ ▼</button>"""

assert mode_btn_target in text, "mode_btn_target missing"
text = text.replace(mode_btn_target, mode_btn_replacement, 1)

# 3. Add Modals HTML before <script>
modals_target = """<div id="build-modal">
  <div class="bm-box">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:10px;">
      <h3 style="color:var(--accent-gold); margin:0;">ПЛАНИРОВАНИЕ КОМНАТЫ</h3>
      <button onclick="toggleBuildMenu()" style="background:none; border:none; color:#bbb; font-size:20px; cursor:pointer;">✕</button>
    </div>
    <div class="bm-list" id="bm-list"></div>
  </div>
</div>

<script>"""

new_modals = """<div id="build-modal">
  <div class="bm-box">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:10px;">
      <h3 style="color:var(--accent-gold); margin:0;">ПЛАНИРОВАНИЕ КОМНАТЫ</h3>
      <button onclick="toggleBuildMenu()" style="background:none; border:none; color:#bbb; font-size:20px; cursor:pointer;">✕</button>
    </div>
    <div class="bm-list" id="bm-list"></div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════════
     GAME MODE SELECTION MODAL
     ═══════════════════════════════════════════════════════════════════ -->
<div id="gamemode-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:210; justify-content:center; align-items:center;">
  <div style="background:#141418; border:1px solid var(--accent-gold); border-radius:8px; padding:22px; max-width:560px; width:92%; box-shadow:0 8px 30px rgba(0,0,0,0.9);">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:12px;">
      <h2 style="color:var(--accent-gold); font-size:19px; margin:0; display:flex; align-items:center; gap:8px;">
        <span>⚖️</span> РЕЖИМ ПРАВЛЕНИЯ В БУНКЕРЕ
      </h2>
      <button onclick="closeGameModeModal()" style="background:none; border:none; color:#cfbfad; font-size:24px; cursor:pointer;">✕</button>
    </div>
    <p style="color:#aaa; font-size:12px; margin:10px 0 16px;">
      Выберите форму правления колонией. Режим определяет, кто строит комнаты, голосует за законы и разрешает кризисы:
    </p>
    <div style="display:flex; flex-direction:column; gap:12px;">
      <!-- Democracy Card -->
      <div class="gm-card" id="gm-card-democracy" onclick="setGameMode('democracy')" style="background:#1b1d24; border:2px solid #2ecc71; border-radius:6px; padding:12px 16px; cursor:pointer; transition:all 0.2s;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="color:#2ecc71; font-weight:bold; font-size:14px;">🏛️ ДЕМОКРАТИЯ (СОВЕТ КОЛОНИИ)</span>
          <span class="gm-badge" id="gm-badge-democracy" style="background:#2ecc71; color:#000; font-size:10px; font-weight:bold; padding:2px 8px; border-radius:10px;">АКТИВЕН</span>
        </div>
        <p style="color:#cfcfd6; font-size:12px; margin:0; line-height:1.4;">
          <strong>Герои сами строят и принимают решения!</strong> Совет колонистов собирается для голосования по законам, распределению пайков, обороне и автономному строительству нужных комнат. Игрок голосует наравне со всеми.
        </p>
      </div>

      <!-- Overseer Card -->
      <div class="gm-card" id="gm-card-overseer" onclick="setGameMode('overseer')" style="background:#1b1d24; border:1px solid #444; border-radius:6px; padding:12px 16px; cursor:pointer; transition:all 0.2s;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="color:#e67e22; font-weight:bold; font-size:14px;">👑 КОМЕНДАНТ (ПРЯМОЕ УПРАВЛЕНИЕ)</span>
          <span class="gm-badge" id="gm-badge-overseer" style="display:none; background:#e67e22; color:#000; font-size:10px; font-weight:bold; padding:2px 8px; border-radius:10px;">АКТИВЕН</span>
        </div>
        <p style="color:#aaa; font-size:12px; margin:0; line-height:1.4;">
          <strong>Единоличная власть игрока.</strong> Стройте только по своему усмотрению, принимайте законы прямыми декретами, дилеммы разрешаются без голосований жителей.
        </p>
      </div>

      <!-- Anarchy Card -->
      <div class="gm-card" id="gm-card-anarchy" onclick="setGameMode('anarchy')" style="background:#1b1d24; border:1px solid #444; border-radius:6px; padding:12px 16px; cursor:pointer; transition:all 0.2s;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="color:#e74c3c; font-weight:bold; font-size:14px;">⚡ АНАРХИЯ (СВОБОДНАЯ ВОЛЯ)</span>
          <span class="gm-badge" id="gm-badge-anarchy" style="display:none; background:#e74c3c; color:#fff; font-size:10px; font-weight:bold; padding:2px 8px; border-radius:10px;">АКТИВЕН</span>
        </div>
        <p style="color:#aaa; font-size:12px; margin:0; line-height:1.4;">
          <strong>Никаких законов и запретов.</strong> Колонисты действуют спонтанно: сами копают где вздумается, тратят провизию и строят по импульсу. Экстремальный хаос.
        </p>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════════
     INTERACTIVE COUNCIL VOTING CHAMBER MODAL
     ═══════════════════════════════════════════════════════════════════ -->
<div id="council-vote-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:220; justify-content:center; align-items:center;">
  <div style="background:#121317; border:2px solid var(--accent-gold); border-radius:10px; padding:22px; max-width:580px; width:92%; box-shadow:0 10px 40px rgba(0,0,0,0.95);">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:12px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:22px;">🏛️</span>
        <div>
          <h2 style="color:var(--accent-gold); font-size:17px; margin:0; letter-spacing:1px;" id="cv-title">СОВЕТ КОЛОНИИ: ГОЛОСОВАНИЕ</h2>
          <span style="color:#888; font-size:11px;" id="cv-subtitle">ДЕМОКРАТИЧЕСКАЯ АССАМБЛЕЯ ВЫЖИВШИХ</span>
        </div>
      </div>
      <span id="cv-voters-count" style="background:#222; color:#2ecc71; font-size:11px; font-weight:bold; padding:3px 8px; border-radius:4px; border:1px solid #333;">4 голоса</span>
    </div>

    <!-- Issue text -->
    <div style="background:#1b1c22; border-left:4px solid var(--accent-gold); padding:10px 14px; margin-bottom:12px; border-radius:0 6px 6px 0;">
      <div style="color:#fff; font-size:13px; font-weight:600; line-height:1.4;" id="cv-prompt-text">Повестка дня...</div>
      <div style="color:#aaa; font-size:11px; margin-top:4px;" id="cv-desc-text">Описание последствий...</div>
    </div>

    <!-- Voters list & quotes -->
    <div style="max-height:170px; overflow-y:auto; margin-bottom:14px; display:flex; flex-direction:column; gap:6px;" id="cv-voters-list"></div>

    <!-- Live Vote Progress Bar -->
    <div style="margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:bold; margin-bottom:4px;">
        <span style="color:#2ecc71;" id="cv-yes-label">ЗА: 0</span>
        <span style="color:#e74c3c;" id="cv-no-label">ПРОТИВ: 0</span>
      </div>
      <div style="height:12px; background:#222; border-radius:6px; overflow:hidden; display:flex; border:1px solid #444;">
        <div id="cv-bar-yes" style="height:100%; width:50%; background:#2ecc71; transition:width 0.3s ease;"></div>
        <div id="cv-bar-no" style="height:100%; width:50%; background:#e74c3c; transition:width 0.3s ease;"></div>
      </div>
    </div>

    <!-- Action buttons -->
    <div style="display:flex; gap:10px; justify-content:flex-end;" id="cv-actions">
      <button class="modal-btn" id="cv-btn-opt-a" style="background:#27ae60; color:#fff; font-size:12px; padding:9px 16px; border-radius:5px; cursor:pointer;">👍 ГОЛОСУЮ ЗА</button>
      <button class="modal-btn" id="cv-btn-opt-b" style="background:#c0392b; color:#fff; font-size:12px; padding:9px 16px; border-radius:5px; cursor:pointer;">👎 ГОЛОСУЮ ПРОТИВ</button>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════════════
     INTERACTIVE WHITEBOARD LAWS MODAL
     ═══════════════════════════════════════════════════════════════════ -->
<div id="whiteboard-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); z-index:215; justify-content:center; align-items:center;">
  <div style="background:#ffffff; color:#1a1917; border:5px solid #a89f91; border-radius:6px; padding:22px; max-width:600px; width:92%; box-shadow:0 10px 40px rgba(0,0,0,0.9); font-family:'Courier New', monospace;">
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px dashed #999; padding-bottom:8px; margin-bottom:12px;">
      <div>
        <h2 style="color:#c0392b; font-size:20px; margin:0; text-decoration:underline;">RULES & DIRECTIVES</h2>
        <span id="wb-mode-status" style="font-size:11px; color:#555; font-weight:bold;">РЕЖИМ: ДЕМОКРАТИЯ (Законы принимаются Советом)</span>
      </div>
      <button onclick="closeWhiteboardModal()" style="background:none; border:none; color:#333; font-size:24px; font-weight:bold; cursor:pointer;">✕</button>
    </div>

    <div style="display:flex; flex-direction:column; gap:12px; max-height:65vh; overflow-y:auto; padding-right:6px;" id="wb-laws-container">
      <!-- Laws list rendered dynamically via JS -->
    </div>
  </div>
</div>

<script>"""

assert modals_target in text, "modals_target missing"
text = text.replace(modals_target, new_modals, 1)

with open('underground.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Game modes modals and DOM buttons patched.")
