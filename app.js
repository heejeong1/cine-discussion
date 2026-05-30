// Application State
let state = {
  type: 'book', // 'book' or 'movie'
  theme: '자아성장',
  tone: 'philosophical',
  title: '',
  creator: '', // Author or Director
  keyword: '', // Custom Keyword Field
  prompts: [],
  currentCardIndex: 0,
  template: 'cine-dark-orange', // Cine Society Brand Default
  authorName: '씨네 쏘사이어티',
  groupName: 'CINE SOCIETY'
};

// 5-Step Labels
const STEP_LABELS = [
  "아이스브레이킹 / 첫인상",
  "인물 심층 분석",
  "핵심 토론 테마",
  "미학 / 연출 / 문체",
  "일상으로의 확장"
];

// DOM Elements
const typeToggle = document.getElementById('typeToggle');
const presetSelect = document.getElementById('presetSelect');
const inputTitle = document.getElementById('inputTitle');
const inputCreator = document.getElementById('inputCreator');
const inputKeyword = document.getElementById('inputKeyword');
const creatorLabel = document.getElementById('creatorLabel');
const themeSelector = document.getElementById('themeSelector');
const toneSelector = document.getElementById('toneSelector');
const btnGenerate = document.getElementById('btnGenerate');

const promptsListContainer = document.getElementById('promptsListContainer');
const btnAddPrompt = document.getElementById('btnAddPrompt');

const designSettings = document.getElementById('designSettings');
const templateCards = document.querySelectorAll('.template-card');
const cardAuthor = document.getElementById('cardAuthor');
const cardGroup = document.getElementById('cardGroup');

const cardDisplayArea = document.getElementById('cardDisplayArea');
const cardEmptyState = document.getElementById('cardEmptyState');
const captureTarget = document.getElementById('captureTarget');
const cardHeaderLabel = document.getElementById('cardHeaderLabel');
const cardBodyContent = document.getElementById('cardBodyContent');
const footerGroupName = document.getElementById('footerGroupName');
const footerAuthorName = document.getElementById('footerAuthorName');

const btnPrevCard = document.getElementById('btnPrevCard');
const btnNextCard = document.getElementById('btnNextCard');
const cardIndicator = document.getElementById('cardIndicator');

const btnCopyText = document.getElementById('btnCopyText');
const btnDownloadCard = document.getElementById('btnDownloadCard');
const btnDownloadAll = document.getElementById('btnDownloadAll');

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
  loadPresets();
  setupEventListeners();
});

// Load Presets into Dropdown
function loadPresets() {
  const list = PRESETS[state.type];
  presetSelect.innerHTML = '<option value="">-- 프리셋 선택 (질문 5개 제공) --</option>';
  list.forEach((item, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${item.title} (${item.author || item.director})`;
    presetSelect.appendChild(option);
  });
}

// Set up Event Listeners
function setupEventListeners() {
  // 1. Type Toggle (Book / Movie)
  typeToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn || btn.classList.contains('active')) return;
    
    // Toggle active classes
    typeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update state
    state.type = btn.dataset.type;
    
    // Update labels and placeholders
    if (state.type === 'book') {
      creatorLabel.textContent = '저자 이름';
      inputCreator.placeholder = '예: 헤르만 헤세';
      cardHeaderLabel.textContent = 'CINE SOCIETY BOOK';
    } else {
      creatorLabel.textContent = '감독 이름';
      inputCreator.placeholder = '예: 봉준호';
      cardHeaderLabel.textContent = 'CINE SOCIETY MOVIE';
    }
    
    // Reset preset select and inputs
    loadPresets();
    inputTitle.value = '';
    inputCreator.value = '';
    inputKeyword.value = '';
  });

  // 2. Preset Select handler
  presetSelect.addEventListener('change', () => {
    const index = presetSelect.value;
    if (index === '') return;
    
    const preset = PRESETS[state.type][index];
    inputTitle.value = preset.title;
    inputCreator.value = preset.author || preset.director;
    inputKeyword.value = preset.defaultKeyword;
    
    // Update Theme and Tone active classes based on preset
    updateSelectorActive(themeSelector, 'theme', preset.theme);
    updateSelectorActive(toneSelector, 'tone', preset.tone);
    
    state.theme = preset.theme;
    state.tone = preset.tone;
  });

  // Helper to change selectors active states
  function updateSelectorActive(container, dataAttr, value) {
    container.querySelectorAll('.tag-btn').forEach(btn => {
      if (btn.dataset[dataAttr] === value) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // 3. Theme Tag Selection
  themeSelector.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-btn');
    if (!btn) return;
    themeSelector.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.theme = btn.dataset.theme;
    presetSelect.value = ''; // Reset preset since customization has been made
  });

  // 4. Tone Tag Selection
  toneSelector.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-btn');
    if (!btn) return;
    toneSelector.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.tone = btn.dataset.tone;
    presetSelect.value = ''; // Reset preset
  });

  // 5. Generate Button (5단 발제문 생성)
  btnGenerate.addEventListener('click', () => {
    const titleVal = inputTitle.value.trim();
    if (!titleVal) {
      alert('작품 제목을 입력해 주세요.');
      inputTitle.focus();
      return;
    }
    
    state.title = titleVal;
    state.creator = inputCreator.value.trim();
    state.keyword = inputKeyword.value.trim();
    
    const finalKeyword = state.keyword ? state.keyword : state.theme;
    
    // Check if preset matches title exactly
    const matchedPreset = PRESETS[state.type].find(item => item.title.toLowerCase() === titleVal.toLowerCase());
    
    if (matchedPreset && presetSelect.value !== '') {
      // Use preset prompts and fuse final keyword
      state.prompts = matchedPreset.prompts.map(prompt => {
        return prompt.replaceAll("[KEYWORD]", `'${finalKeyword}'`);
      });
    } else {
      // Generate dynamically using templates (returns 5 prompts)
      state.prompts = TEMPLATE_BUILDER.generate(
        state.title,
        state.creator,
        state.type,
        state.theme,
        state.tone,
        state.keyword
      );
    }
    
    // Reset view variables
    state.currentCardIndex = 0;
    
    // Display workstations
    renderPromptsEditor();
    updateCardCanvas();
    
    cardEmptyState.style.display = 'none';
    cardDisplayArea.style.display = 'flex';
    designSettings.style.display = 'flex';
    btnAddPrompt.style.display = 'flex';
  });

  // 6. Add Prompt Button
  btnAddPrompt.addEventListener('click', () => {
    state.prompts.push("새 토론 질문을 이곳에 자유롭게 작성해 주세요.");
    renderPromptsEditor();
    updateCardCanvas();
  });

  // 7. Design Customizer - Template Change
  templateCards.forEach(card => {
    card.addEventListener('click', () => {
      templateCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.template = card.dataset.template;
      
      // Update canvas template class
      captureTarget.className = `card-canvas card-template-${state.template}`;
    });
  });

  // 8. Design Customizer - Meta text sync
  cardAuthor.addEventListener('input', () => {
    state.authorName = cardAuthor.value.trim() || '씨네 쏘사이어티';
    footerAuthorName.textContent = `by ${state.authorName}`;
  });

  cardGroup.addEventListener('input', () => {
    state.groupName = cardGroup.value.trim() || 'CINE SOCIETY';
    footerGroupName.textContent = state.groupName;
  });

  // 9. Card Carousel Navigation
  btnPrevCard.addEventListener('click', () => {
    if (state.currentCardIndex > 0) {
      state.currentCardIndex--;
      updateCardCanvas();
    }
  });

  btnNextCard.addEventListener('click', () => {
    const total = state.prompts.length + 2; // Cover + Prompts + Outro
    if (state.currentCardIndex < total - 1) {
      state.currentCardIndex++;
      updateCardCanvas();
    }
  });

  // 10. Copy Prompt Text to Clipboard
  btnCopyText.addEventListener('click', () => {
    const typeLabel = state.type === 'book' ? '도서' : '영화';
    let text = `[CINE SOCIETY ${typeLabel} 토론 모임] ${state.title}\n`;
    if (state.creator) {
      const creatorTitle = state.type === 'book' ? '저자' : '감독';
      text += `${creatorTitle}: ${state.creator}\n`;
    }
    if (state.keyword) {
      text += `토론 키워드: ${state.keyword}\n`;
    }
    text += `모임 이름: ${state.groupName} | 발제자: ${state.authorName}\n\n`;
    text += `--- 5단계 토론 가이드 ---\n\n`;
    
    state.prompts.forEach((prompt, index) => {
      const stepName = STEP_LABELS[index] || `추가 질문`;
      text += `[${index + 1}단계: ${stepName}]\n${prompt}\n\n`;
    });
    
    text += `---------------------------\n"오늘 나눈 풍부한 토론이 서로에게 깊고 따뜻한 생각의 온도로 기억되기를 바랍니다."`;
    
    navigator.clipboard.writeText(text).then(() => {
      alert('5단 발제 가이드 텍스트가 클립보드에 성공적으로 복사되었습니다. 카카오톡이나 노션에 붙여넣어 활용하세요.');
    }).catch(err => {
      console.error('클립보드 복사 실패:', err);
    });
  });

  // 11. Download Current Card
  btnDownloadCard.addEventListener('click', () => {
    downloadCardImage(state.currentCardIndex);
  });

  // 12. Download All Cards
  btnDownloadAll.addEventListener('click', () => {
    downloadAllCards();
  });
}

// Render Prompts Editor in Left Sub-column
function renderPromptsEditor() {
  promptsListContainer.innerHTML = '';
  
  state.prompts.forEach((prompt, index) => {
    const item = document.createElement('div');
    item.className = 'prompt-item';
    
    const stepName = STEP_LABELS[index] || "추가 토론 질문";
    const stepBadge = index < 5 ? `${index + 1}단계: ${stepName}` : `질문 ${String(index + 1).padStart(2, '0')}`;
    
    item.innerHTML = `
      <div class="prompt-header">
        <span class="prompt-badge">${stepBadge}</span>
        <div class="prompt-actions">
          <button class="icon-btn delete-btn" data-index="${index}" title="삭제">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
      <textarea class="prompt-textarea" rows="3" data-index="${index}">${prompt}</textarea>
    `;
    
    promptsListContainer.appendChild(item);
  });
  
  // Attach input & delete listeners to textareas
  const textareas = promptsListContainer.querySelectorAll('.prompt-textarea');
  textareas.forEach(ta => {
    ta.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index);
      state.prompts[idx] = e.target.value;
      
      // Update canvas live if active card is this slide
      if (state.currentCardIndex === idx + 1) {
        updateCardCanvas();
      }
    });
  });

  const deleteBtns = promptsListContainer.querySelectorAll('.delete-btn');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index);
      state.prompts.splice(idx, 1);
      
      const maxIndex = state.prompts.length + 1;
      if (state.currentCardIndex > maxIndex) {
        state.currentCardIndex = maxIndex;
      }
      
      renderPromptsEditor();
      updateCardCanvas();
    });
  });
}

// Update Card Canvas Layout depending on active slide
function updateCardCanvas() {
  const total = state.prompts.length + 2; // Cover + Prompts + Outro
  
  // Update header based on type and current slide type
  const typeLabel = state.type === 'book' ? 'BOOK CLUB' : 'MOVIE CLUB';
  
  if (state.currentCardIndex === 0) {
    cardHeaderLabel.textContent = `CINE SOCIETY`;
  } else if (state.currentCardIndex === total - 1) {
    cardHeaderLabel.textContent = `OUTRO`;
  } else {
    const stepName = STEP_LABELS[state.currentCardIndex - 1] || "QUESTION";
    cardHeaderLabel.textContent = stepName;
  }

  // Render Inner Content
  cardBodyContent.innerHTML = '';
  
  if (state.currentCardIndex === 0) {
    // 1. Cover Card
    const creatorRole = state.type === 'book' ? '저자' : '감독';
    const creatorText = state.creator ? `${state.creator} ${creatorRole}` : '';
    
    cardBodyContent.innerHTML = `
      <h3 class="card-title">${state.title}</h3>
      <div class="card-subtitle">${creatorText}</div>
      <div style="margin-top: 1.8rem; font-size: 0.85rem; letter-spacing: 0.25em; opacity: 0.85; text-transform: uppercase;">
        <span style="border-top: 2px solid currentColor; padding-top: 0.5rem; display: inline-block; font-family: 'Cinzel', serif; font-weight: 800;">
          5단 토론 질문집
        </span>
      </div>
    `;
  } else if (state.currentCardIndex > 0 && state.currentCardIndex <= state.prompts.length) {
    // 2. Prompt Card (1 to 5)
    const promptText = state.prompts[state.currentCardIndex - 1];
    const stepName = STEP_LABELS[state.currentCardIndex - 1];
    const questionHeader = stepName ? `0${state.currentCardIndex}. ${stepName}` : `질문 0${state.currentCardIndex}`;
    
    cardBodyContent.innerHTML = `
      <div class="card-question-number">${questionHeader}</div>
      <div class="card-text">${promptText}</div>
    `;
  } else {
    // 3. Outro Card
    cardBodyContent.innerHTML = `
      <div class="card-question-number">마치며</div>
      <div class="card-text" style="font-size: 1.05rem; line-height: 1.85;">
        "오늘 나눈 풍부한 토론이<br>
        서로에게 깊고 따뜻한 온도로<br>
        기억되기를 진심으로 바랍니다."
      </div>
    `;
  }

  // Update Footer Meta text
  footerGroupName.textContent = state.groupName;
  footerAuthorName.textContent = `by ${state.authorName}`;

  // Update slider indicator
  cardIndicator.textContent = `${state.currentCardIndex + 1} / ${total}`;

  // Manage navigation button states
  btnPrevCard.disabled = state.currentCardIndex === 0;
  btnNextCard.disabled = state.currentCardIndex === total - 1;
  btnPrevCard.style.opacity = state.currentCardIndex === 0 ? '0.3' : '1';
  btnNextCard.style.opacity = state.currentCardIndex === total - 1 ? '0.3' : '1';
}

// Capture current card and trigger download
function downloadCardImage(index) {
  captureTarget.style.borderRadius = '0px'; // Render borderless for clean output
  
  html2canvas(captureTarget, {
    scale: 2.5, // High resolution PNG
    useCORS: true,
    backgroundColor: null
  }).then(canvas => {
    captureTarget.style.borderRadius = '12px';
    
    const link = document.createElement('a');
    const filename = `${state.title.replace(/\s+/g, '_')}_카드뉴스_${String(index).padStart(2, '0')}.png`;
    
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    console.error('이미지 저장 오류:', err);
    alert('이미지 렌더링 중 오류가 발생했습니다.');
  });
}

// Sequential download of all cards (One-click automation)
function downloadAllCards() {
  const total = state.prompts.length + 2;
  let idx = 0;
  
  const originalBtnText = btnDownloadAll.innerHTML;
  btnDownloadAll.disabled = true;
  btnDownloadAll.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 고해상도 카드뉴스 일괄 저장 중...';
  
  function captureNext() {
    if (idx >= total) {
      // Done saving all
      btnDownloadAll.disabled = false;
      btnDownloadAll.innerHTML = originalBtnText;
      
      // Restore slider to cover
      state.currentCardIndex = 0;
      updateCardCanvas();
      alert('모든 카드뉴스 파일이 컴퓨터에 개별 PNG 이미지 파일로 즉시 자동 저장되었습니다.');
      return;
    }
    
    state.currentCardIndex = idx;
    updateCardCanvas();
    
    // Wait for DOM paint before capturing
    setTimeout(() => {
      captureTarget.style.borderRadius = '0px';
      
      html2canvas(captureTarget, {
        scale: 2.5,
        useCORS: true
      }).then(canvas => {
        captureTarget.style.borderRadius = '12px';
        
        const link = document.createElement('a');
        const cardLabel = idx === 0 ? '커버' : (idx === total - 1 ? '마치며' : `질문_${idx}`);
        const filename = `${state.title.replace(/\s+/g, '_')}_카드뉴스_${idx}_[${cardLabel}].png`;
        
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        idx++;
        // Capture next card with safety timeout
        setTimeout(captureNext, 400);
      }).catch(err => {
        console.error('일괄 이미지 저장 오류:', err);
        btnDownloadAll.disabled = false;
        btnDownloadAll.innerHTML = originalBtnText;
      });
    }, 180);
  }
  
  // Trigger sequential saving
  captureNext();
}
