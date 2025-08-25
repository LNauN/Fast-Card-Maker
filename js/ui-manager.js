const UIManager = (function() {
  let state, config, eventBus;

  /**
   * 初始化UI管理器
   * @param {Object} appState - 应用状态
   * @param {Object} appConfig - 应用配置
   * @param {Object} bus - 事件总线
   */
  function init(appState, appConfig, bus) {
    state = appState;
    config = appConfig;
    eventBus = bus;
    
    bindEventListeners();
    setupOverlayContainer();
    initBleedControls();

    eventBus.on('layersLoaded', () => {
      showEditableRegions();
    });
  }

  /**
   * 绑定事件监听器
   */
  function bindEventListeners() {
    // 生成按钮
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        CanvasManager.renderCard();
      });
    }
    
    // 重置按钮
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        eventBus.emit('resetCard');
      });
    }
  }

  /**
   * 设置覆盖层容器样式
   */
  function setupOverlayContainer() {
    const overlayEl = document.getElementById('editableAreasOverlay');
    const canvasContainer = state.canvas?.parentElement;
    
    if (overlayEl && canvasContainer) {
      overlayEl.style.position = 'absolute';
      overlayEl.style.left = '0';
      overlayEl.style.top = '0';
      overlayEl.style.width = '100%';
      overlayEl.style.height = '100%';
    }
  }

  /**
   * 更新编辑器UI
   */
  function updateEditorUI() {
    if (!state.currentTemplate) return;
    
    updateTextFields();
    updateImageUploads();
    showEditableRegions();
  }

  /**
   * 更新文本输入框
   */
  function updateTextFields() {
    const containerEl = document.getElementById('textFieldsContainer');
    if (!containerEl) return;
    
    containerEl.innerHTML = '';
    
    const textAreas = Array.isArray(state.currentTemplate.textAreas) 
      ? state.currentTemplate.textAreas 
      : [];
      
    const verticalGroups = Array.isArray(state.currentTemplate.verticalGroups)
      ? state.currentTemplate.verticalGroups
      : [];
    
    // 添加普通文本区域
    textAreas.forEach(area => {
      if (area.id) {
        containerEl.appendChild(createTextAreaField(area));
      }
    });
    
    // 添加技能组编辑区域
    verticalGroups.forEach(group => {
      if (group.id) {
        containerEl.appendChild(createVerticalGroupEditor(group));
      }
    });
    
    // 如果没有可编辑区域
    if (textAreas.length === 0 && verticalGroups.length === 0) {
      containerEl.innerHTML = '<p class="text-gray-500 text-sm italic">此模板没有可编辑文本区域</p>';
    }
  }

  /**
   * 创建文本区域输入框
   * @param {Object} area - 文本区域配置
   * @returns {HTMLElement} 文本输入框元素
   */
  function createTextAreaField(area) {
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'mb-4 p-3 border rounded-lg bg-gray-50';
    fieldGroup.dataset.textId = area.id;
    
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-2';
    
    const labelContainer = document.createElement('div');
    labelContainer.className = 'flex items-center gap-2';
    
    const label = document.createElement('label');
    label.htmlFor = `text-${area.id}`;
    label.className = 'block text-sm font-medium text-gray-700';
    label.textContent = area.placeholder || '文本区域';
    
    // 添加背景标记
    if (area.hasBackground) {
      const bgIndicator = document.createElement('span');
      bgIndicator.className = 'px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded';
      bgIndicator.textContent = '带底框';
      labelContainer.appendChild(bgIndicator);
    }
    
    // 添加位置锁定标记
    if (area.lockPosition) {
      const lockIndicator = document.createElement('span');
      lockIndicator.className = 'px-1.5 py-0.5 text-xs bg-green-100 text-green-800 rounded';
      lockIndicator.textContent = area.lockPosition === 'top' ? '锁定顶部' : '锁定底部';
      labelContainer.appendChild(lockIndicator);
    }
    
    // 创建文本输入框
    const textarea = document.createElement('textarea');
    textarea.id = `text-${area.id}`;
    textarea.dataset.textId = area.id;
    textarea.placeholder = area.placeholder || '请输入文本...';
    textarea.className = 'input-field w-full p-2 border border-gray-300 rounded';
    textarea.rows = area.height > 60 ? 4 : 2;
    textarea.value = state.userContent.textContent[area.id] || '';
    textarea.wrap = 'soft';
    textarea.style.whiteSpace = 'pre-wrap';
    
    // 添加输入事件监听
    textarea.addEventListener('input', (e) => {
      state.userContent.textContent[area.id] = e.target.value;
      eventBus.emit('contentUpdated');
    });
    
    labelContainer.prepend(label);
    header.appendChild(labelContainer);
    fieldGroup.appendChild(header);
    fieldGroup.appendChild(textarea);
    
    return fieldGroup;
  }

  /**
   * 创建垂直组编辑器
   * @param {Object} group - 垂直组配置
   * @returns {HTMLElement} 垂直组编辑区域元素
   */
  function createVerticalGroupEditor(group) {
    const groupContainer = document.createElement('div');
    groupContainer.className = 'mt-6 mb-4';
    
    const groupHeader = document.createElement('div');
    groupHeader.className = 'text-base font-semibold text-gray-800 mb-3';
    groupHeader.textContent = '技能描述区';
    groupContainer.appendChild(groupHeader);
    
    const groupContent = document.createElement('div');
    groupContent.className = 'space-y-4 border-l-4 border-primary pl-4 py-2';
    groupContainer.appendChild(groupContent);
    
    // 添加组内每个项目
    group.items.forEach(item => {
      if (item.id) {
        groupContent.appendChild(createVerticalGroupItemField(item));
      }
    });
    
    return groupContainer;
  }

  /**
   * 创建垂直组项目输入框
   * @param {Object} item - 项目配置
   * @returns {HTMLElement} 项目输入框元素
   */
  function createVerticalGroupItemField(item) {
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'mb-4 p-3 border rounded-lg bg-gray-50';
    fieldGroup.dataset.textId = item.id;
    
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-2';
    
    const label = document.createElement('label');
    label.htmlFor = `text-${item.id}`;
    label.className = 'block text-sm font-medium text-gray-700';
    label.textContent = item.title;
    
    header.appendChild(label);
    
    const textarea = document.createElement('textarea');
    textarea.id = `text-${item.id}`;
    textarea.dataset.textId = item.id;
    textarea.placeholder = item.contentPlaceholder || '请输入描述...';
    textarea.className = 'input-field w-full p-2 border border-gray-300 rounded';
    textarea.rows = 3;
    textarea.value = state.userContent.textContent[item.id] || '';
    textarea.wrap = 'soft';
    textarea.style.whiteSpace = 'pre-wrap';
    
    textarea.addEventListener('input', (e) => {
      state.userContent.textContent[item.id] = e.target.value;
      eventBus.emit('contentUpdated');
    });
    
    fieldGroup.appendChild(header);
    fieldGroup.appendChild(textarea);
    
    return fieldGroup;
  }

  /**
   * 更新图片上传区域
   */
  function updateImageUploads() {
    const containerEl = document.getElementById('imageUploadsContainer');
    if (!containerEl) return;
    
    containerEl.innerHTML = '';
    
    const imageAreas = Array.isArray(state.currentTemplate.imageAreas)
      ? state.currentTemplate.imageAreas
      : [];
    
    if (imageAreas.length === 0) {
      containerEl.innerHTML = '<p class="text-gray-500 text-sm italic">此模板没有可上传图片区域</p>';
      return;
    }
    
    // 为每个图片区域创建上传控件
    imageAreas.forEach(area => {
      // 假设ImageProcessor提供了创建上传字段的方法
      ImageProcessor.createImageUploadField(area);
    });
  }

  /**
   * 显示可编辑区域指示器
   */
  function showEditableRegions() {
    const overlayEl = document.getElementById('editableAreasOverlay');
    const canvasEl = state.canvas;
    
    if (!overlayEl || !state.currentTemplate || !canvasEl) return;
    
    overlayEl.innerHTML = '';
    
    requestAnimationFrame(() => {
      // 获取画布位置和尺寸信息
      const canvasRect = canvasEl.getBoundingClientRect();
      const containerRect = canvasEl.parentElement.getBoundingClientRect();
      
      // 计算画布在容器内的偏移和缩放比例
      const canvasOffsetX = canvasRect.left - containerRect.left;
      const canvasOffsetY = canvasRect.top - containerRect.top;
      const scaleX = canvasRect.width / canvasEl.width;
      const scaleY = canvasRect.height / canvasEl.height;
      
      // 显示文字区域边界框
      (state.currentTemplate.textAreas || []).forEach(area => {
        overlayEl.appendChild(
          createTextAreaIndicator(area, canvasOffsetX, canvasOffsetY, scaleX, scaleY)
        );
      });
      
      // 显示技能组边界框
      (state.currentTemplate.verticalGroups || []).forEach(group => {
        const groupElements = createVerticalGroupIndicators(
          group, canvasOffsetX, canvasOffsetY, scaleX, scaleY
        );
        
        groupElements.forEach(el => overlayEl.appendChild(el));
      });
      
      // 显示图片区域边界框
      (state.currentTemplate.imageAreas || []).forEach(area => {
        overlayEl.appendChild(
          createImageAreaIndicator(area, canvasOffsetX, canvasOffsetY, scaleX, scaleY)
        );
      });
    });
  }

  /**
   * 创建文本区域指示器
   * @param {Object} area - 文本区域配置
   * @param {number} offsetX - X偏移
   * @param {number} offsetY - Y偏移
   * @param {number} scaleX - X缩放
   * @param {number} scaleY - Y缩放
   * @returns {HTMLElement} 指示器元素
   */
  function createTextAreaIndicator(area, offsetX, offsetY, scaleX, scaleY) {
    const indicator = document.createElement('div');
    indicator.className = 'editable-indicator absolute border-2 border-primary/50 rounded pointer-events-none';
    indicator.style.left = `${offsetX + (area.x || 0) * scaleX}px`;
    indicator.style.top = `${offsetY + (area.y || 0) * scaleY}px`;
    indicator.style.width = `${(area.width || 0) * scaleX}px`;
    indicator.style.height = `${(area.height || 0) * scaleY}px`;
    
    // 添加图标
    const icon = document.createElement('i');
    icon.className = 'fa fa-font absolute top-1 left-1 text-primary';
    indicator.appendChild(icon);
    
    // 添加标签
    const labelParts = [area.placeholder || '文本区域'];
    if (area.hasBackground) labelParts.push('带底框');
    if (area.lockPosition) labelParts.push(area.lockPosition === 'top' ? '锁定顶部' : '锁定底部');
    
    const label = document.createElement('div');
    label.className = 'absolute bottom-1 left-0 right-0 text-center text-xs bg-primary/80 text-white px-1 rounded';
    label.textContent = labelParts.join(' · ');
    indicator.appendChild(label);
    
    return indicator;
  }

    /**
     * 创建垂直组指示器
     * @param {Object} group - 垂直组配置
     * @param {number} offsetX - X偏移
     * @param {number} offsetY - Y偏移
     * @param {number} scaleX - X缩放
     * @param {number} scaleY - Y缩放
     * @returns {HTMLElement[]} 指示器元素数组
     */
    function createVerticalGroupIndicators(group, canvasOffsetX, canvasOffsetY, scaleX, scaleY) {
        const indicators = [];
        let currentYPosition = group.y || 0;
        const groupX = group.x || 0;
        const groupWidth = group.width || 0;
        const groupSpacing = group.spacing || 15;

        // 1. 计算每个技能项的实时高度（使用更精确的计算方法）
        const itemHeightList = group.items.map(skillItem => {
            if (!skillItem.id) return 0;
            
            // 获取技能项内容
            const itemContent = state.userContent.textContent[skillItem.id] 
            || skillItem.contentPlaceholder 
            || '';
            
            // 计算内容区域宽度（减去标题宽度和留白）
            const padding = skillItem.padding || { left: 0, right: 0, top: 0, bottom: 0 };
            const contentAreaWidth = groupWidth 
            - (skillItem.titleWidth || 100) 
            - padding.left 
            - padding.right;
            
            // 计算内容高度（含上下留白）
            const contentHeight = TextProcessor.calculateTextHeight(
            itemContent, 
            contentAreaWidth, 
            skillItem.fontSize || 16
            );
            
            // 确保最小高度，避免边界框过小
            const minHeight = (skillItem.titleFontSize || 18) * 1.5 + padding.top + padding.bottom;
            return Math.max(contentHeight + padding.top + padding.bottom, minHeight);
        });

        // 2. 创建组外框指示器（这是用户看到的预览边界框）
        const totalGroupHeight = calculateTotalGroupHeight(itemHeightList, groupSpacing);
        const groupIndicator = createGroupOuterIndicator(
            groupX, currentYPosition, groupWidth, totalGroupHeight,
            canvasOffsetX, canvasOffsetY, scaleX, scaleY
        );
        indicators.push(groupIndicator);
    return indicators;
    }

  /**
   * 辅助函数：计算组总高度
   * @param {number[]} itemHeights - 项目高度数组
   * @param {number} spacing - 项目间距
   * @returns {number} 组总高度
   */
  function calculateTotalGroupHeight(itemHeights, spacing) {
    return itemHeights.reduce((total, height, index) => {
      const addSpacing = index < itemHeights.length - 1 ? spacing : 0;
      return total + height + addSpacing;
    }, 0);
  }

  /**
   * 辅助函数：创建组外框指示器
   */
  function createGroupOuterIndicator(x, y, width, height, offsetX, offsetY, scaleX, scaleY) {
    const indicator = document.createElement('div');
    indicator.className = 'editable-indicator absolute border-2 border-purple-500 rounded pointer-events-none';
    indicator.style.left = `${offsetX + x * scaleX}px`;
    indicator.style.top = `${offsetY + y * scaleY}px`;
    indicator.style.width = `${width * scaleX}px`;
    indicator.style.height = `${height * scaleY}px`;
    
    const label = document.createElement('div');
    label.className = 'absolute -top-6 left-0 text-xs bg-purple-500 text-white px-2 rounded';
    label.textContent = '技能描述区';
    indicator.appendChild(label);
    
    return indicator;
  }

    /**
     * 创建技能项边界框（使用固定标题高度）
     */
    function createSkillItemIndicator(x, y, width, height, title, offsetX, offsetY, scaleX, scaleY, titleWidth) {
        const container = document.createElement('div');
        container.className = 'absolute pointer-events-none';
        container.style.left = `${offsetX + x * scaleX}px`;
        container.style.top = `${offsetY + y * scaleY}px`;
        container.style.width = `${width * scaleX}px`;
        container.style.height = `${height * scaleY}px`;
        
        // 技能项外框
        const outerBox = document.createElement('div');
        outerBox.className = 'editable-indicator absolute border border-blue-400/70 rounded w-full h-full';
        container.appendChild(outerBox);
        
        // 关键修复：计算固定标题高度（与文本处理器保持一致）
        const titleFontSize = 18; // 应与配置保持一致
        const padding = 8; // 应与配置保持一致
        const fixedTitleHeight = titleFontSize * 1.8 + padding * 2;
        
        // 标题区域标记（固定高度）
        const titleBox = document.createElement('div');
        titleBox.className = 'absolute border border-yellow-500/70 bg-yellow-500/10';
        titleBox.style.width = `${titleWidth * scaleX}px`;
        titleBox.style.height = `${fixedTitleHeight * scaleY}px`; // 使用固定高度
        titleBox.style.left = '0';
        titleBox.style.top = '0';
        container.appendChild(titleBox);
        
        // 标题标签
        const label = document.createElement('div');
        label.className = 'absolute top-1 left-2 text-xs bg-blue-400/70 text-white px-1 rounded';
        label.textContent = title;
        container.appendChild(label);
        
        return container;
    }

  /**
   * 创建图片区域指示器
   * @param {Object} area - 图片区域配置
   * @param {number} offsetX - X偏移
   * @param {number} offsetY - Y偏移
   * @param {number} scaleX - X缩放
   * @param {number} scaleY - Y缩放
   * @returns {HTMLElement} 指示器元素
   */
  function createImageAreaIndicator(area, offsetX, offsetY, scaleX, scaleY) {
    const container = document.createElement('div');
    container.className = 'absolute pointer-events-none';
    container.style.left = `${offsetX + (area.x || 0) * scaleX}px`;
    container.style.top = `${offsetY + (area.y || 0) * scaleY}px`;
    container.style.width = `${(area.width || 0) * scaleX}px`;
    container.style.height = `${(area.height || 0) * scaleY}px`;
    
    // 创建形状指示器
    const shapeIndicator = createShapeElement(
      area, 
      (area.width || 0) * scaleX, 
      (area.height || 0) * scaleY
    );
    
    // 创建标签
    const label = document.createElement('div');
    label.className = 'absolute bottom-1 left-0 right-0 text-center text-xs bg-primary/80 text-white px-1 rounded';
    label.textContent = area.placeholder || '图片区域';
    
    container.appendChild(shapeIndicator);
    container.appendChild(label);
    
    return container;
  }

  /**
   * 创建形状预览元素
   * @param {Object} area - 区域配置
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @returns {HTMLElement} SVG形状元素
   */
  function createShapeElement(area, width, height) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    
    let pathData = '';
    
    switch(area.shape) {
      case 'rectangle':
        pathData = `M0,0 L${width},0 L${width},${height} L0,${height} Z`;
        break;
        
      case 'diamond':
        pathData = `M${width/2},0 L${width},${height/2} L${width/2},${height} L0,${height/2} Z`;
        break;
        
      case 'trapezoid':
        const topWidth = area.trapezoidParams?.topWidth || width * 0.8;
        const topOffset = (width - topWidth) / 2;
        pathData = `M${topOffset},0 L${width - topOffset},0 L${width},${height} L0,${height} Z`;
        break;
        
      case 'circle':
        const cx = width / 2;
        const cy = height / 2;
        const r = Math.min(cx, cy);
        pathData = `M${cx},${cy} m-${r},0 a${r},${r} 0 1,0 ${r*2},0 a${r},${r} 0 1,0 -${r*2},0`;
        break;
        
      default:
        pathData = `M0,0 L${width},0 L${width},${height} L0,${height} Z`;
    }
    
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'transparent');
    path.setAttribute('stroke', 'rgba(79, 70, 229, 0.7)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-dasharray', '5,5');
    
    svg.appendChild(path);
    return svg;
  }

  /**
   * 显示加载状态
   */
  function showLoadingState() {
    const loadingEl = document.getElementById('loadingIndicator');
    if (loadingEl) {
      loadingEl.classList.remove('hidden');
    }
  }

  /**
   * 隐藏加载状态
   */
  function hideLoadingState() {
    const loadingEl = document.getElementById('loadingIndicator');
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
  }

  /**
   * 启用操作按钮
   */
  function enableActionButtons() {
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.disabled = false;
    
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.disabled = false;
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.disabled = false;
    
    // 隐藏"未选择模板"提示
    const noTemplateEl = document.getElementById('noTemplateSelected');
    if (noTemplateEl) {
      noTemplateEl.classList.add('hidden');
    }
  }

  /**
   * 禁用操作按钮
   */
  function disableActionButtons() {
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.disabled = true;
    
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.disabled = true;
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.disabled = true;
  }

  // 初始化出血线控制
  function initBleedControls() {
    const bleedInputs = {
      top: document.getElementById('bleedTop'),
      right: document.getElementById('bleedRight'),
      bottom: document.getElementById('bleedBottom'),
      left: document.getElementById('bleedLeft')
    };

    // 设置初始值
    bleedInputs.top.value = AppConfig.bleed.top;
    bleedInputs.right.value = AppConfig.bleed.right;
    bleedInputs.bottom.value = AppConfig.bleed.bottom;
    bleedInputs.left.value = AppConfig.bleed.left;

    // 添加事件监听
    Object.keys(bleedInputs).forEach(key => {
      if (bleedInputs[key]) {
        bleedInputs[key].addEventListener('input', (e) => {
          const value = parseInt(e.target.value) || 0;
          AppConfig.bleed[key] = value;
          EventBus.emit('contentUpdated');
        });
      }
    });
  }

  /**
   * 更新技能组的可编辑区域指示器
   * @param {Object} group - 技能组配置（verticalGroups 中的项）
   */
  function updateSkillGroupIndicators(group) {
    const overlay = document.getElementById('editableAreasOverlay');
    if (!overlay || !group || !group.items) return;

    // 清除该组旧的指示器（通过特定类名标识）
    document.querySelectorAll(`.skill-indicator-${group.id}`).forEach(el => el.remove());

    let currentY = group.y; // 起始Y坐标（从组配置获取）
    const groupX = group.x;
    const groupWidth = group.width;
    const spacing = group.spacing || 15; // 技能项间距

    group.items.forEach((item, index) => {
      // 使用动态计算的高度（从状态获取）
      const itemHeight = state.skillItemHeights?.[item.id] || 50; // 默认高度兜底

      // 创建指示器元素
      const indicator = document.createElement('div');
      indicator.className = `editable-indicator skill-indicator-${group.id} absolute border-2 border-dashed border-primary`;
      indicator.style.left = `${groupX}px`;
      indicator.style.top = `${currentY}px`;
      indicator.style.width = `${groupWidth}px`;
      indicator.style.height = `${itemHeight}px`;
      indicator.title = `技能项 ${index + 1}`;

      overlay.appendChild(indicator);

      // 累加高度和间距，计算下一个技能项的起始Y坐标
      currentY += itemHeight + spacing;
    });
  }

  return {
    init,
    updateEditorUI,
    updateTextFields,
    updateImageUploads,
    showEditableRegions,
    showLoadingState,
    hideLoadingState,
    enableActionButtons,
    disableActionButtons
  };
})();
