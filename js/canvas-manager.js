const CanvasManager = (function() {
  let state, config;

  /**
   * 初始化画布管理器
   * @param {Object} appState - 应用状态
   * @param {Object} appConfig - 应用配置
   */
  function init(appState, appConfig) {
    state = appState;
    config = appConfig;
    initCanvasElement();
  }

  /**
   * 初始化画布元素
   */
  function initCanvasElement() {
    const canvasEl = document.getElementById('cardCanvas');
    if (!canvasEl) {
      console.error('未找到canvas元素');
      return;
    }

    state.canvas = canvasEl;
    state.canvasCtx = canvasEl.getContext('2d');

    if (!state.canvasCtx) {
      console.error('无法获取canvas 2D上下文');
    }
  }

  /**
   * 调整画布尺寸
   * @param {number} width - 宽度(像素)
   * @param {number} height - 高度(像素)
   * @returns {number} 缩放比例
   */
  function resizeCanvas(width, height) {
    if (!state.canvas) return 1;

    // 设置画布实际尺寸（像素）
    state.canvas.width = width;
    state.canvas.height = height;

    // 计算缩放比例以适应显示区域
    const maxDisplayWidth = 500;
    const scale = Math.min(maxDisplayWidth / width, 1);

    // 设置画布显示尺寸
    state.canvas.style.width = `${width * scale}px`;
    state.canvas.style.height = `${height * scale}px`;

    // 调整覆盖层尺寸以匹配画布
    const overlayEl = document.getElementById('editableAreasOverlay');
    if (overlayEl) {
      overlayEl.style.width = `${width * scale}px`;
      overlayEl.style.height = `${height * scale}px`;
    }

    // 更新尺寸显示
    updateCanvasDimensionsDisplay(width, height);

    return scale;
  }

  /**
   * 更新画布尺寸显示
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  function updateCanvasDimensionsDisplay(width, height) {
    const dimensionsEl = document.getElementById('cardDimensions');
    if (dimensionsEl) {
      dimensionsEl.textContent = `${width} × ${height} px`;
    }
  }

  /**
   * 渲染整个卡牌
   */
  function renderCard() {
    // 增加防御性检查
    if (!state || !state.currentTemplate || !state.canvas || !state.canvasCtx) {
      console.warn('无法渲染卡牌：缺少必要的状态或画布上下文');
      return;
    }

    // 显示加载状态
    UIManager.showLoadingState();

    // 使用setTimeout避免UI阻塞
    setTimeout(() => {
      try {
        // 清除画布
        clearCanvas();

        // 绘制背景（如果没有背景图层）
        drawBackgroundIfNeeded();

        // 收集并排序所有元素（增加错误处理）
        const elements = collectAndSortElements();
        if (!elements || !Array.isArray(elements)) {
          throw new Error('无法收集有效的渲染元素');
        }

        // 渲染所有元素
        renderAllElements(elements);
      } catch (error) {
        console.error('渲染卡牌时出错:', error);
        drawErrorBackground(error.message); // 显示具体错误信息用于调试
      } finally {
        // 隐藏加载状态
        UIManager.hideLoadingState();
      }
    }, 100);
  }

  /**
   * 清除画布
   */
  function clearCanvas() {
    state.canvasCtx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  }

  /**
   * 如果没有背景图层则绘制默认背景
   */
  function drawBackgroundIfNeeded() {
    const hasBackgroundLayer = state.templateLayers.some(
      layer => (layer.zIndex || 0) <= 10
    );
    
    if (!hasBackgroundLayer) {
      drawSolidBackground();
    }
  }

  /**
   * 绘制纯色背景
   */
  function drawSolidBackground() {
    state.canvasCtx.fillStyle = config.solidColor;
    state.canvasCtx.fillRect(0, 0, state.canvas.width, state.canvas.height);
    
    // 绘制边框
    state.canvasCtx.strokeStyle = '#dddddd';
    state.canvasCtx.lineWidth = 1;
    state.canvasCtx.strokeRect(0, 0, state.canvas.width, state.canvas.height);
  }

  /**
   * 绘制错误状态背景（显示更详细的信息）
   * @param {string} errorMessage - 错误信息
   */
  function drawErrorBackground(errorMessage) {
    state.canvasCtx.fillStyle = '#ffebee';
    state.canvasCtx.fillRect(0, 0, state.canvas.width, state.canvas.height);
    
    state.canvasCtx.fillStyle = '#b71c1c';
    state.canvasCtx.font = '16px Arial, sans-serif';
    state.canvasCtx.textAlign = 'center';
    
    // 显示错误标题
    state.canvasCtx.fillText(
      '渲染出错', 
      state.canvas.width / 2, 
      state.canvas.height / 2 - 20
    );
    
    // 显示简要错误信息（适合调试）
    state.canvasCtx.font = '12px Arial, sans-serif';
    state.canvasCtx.fillText(
      errorMessage.substring(0, 50) + (errorMessage.length > 50 ? '...' : ''), 
      state.canvas.width / 2, 
      state.canvas.height / 2 + 10
    );
  }

  /**
   * 收集并按层级排序所有元素
   * @returns {Array} 排序后的元素数组
   */
  function collectAndSortElements() {
    try {
      const elements = [];

      // 增加防御性检查
      if (!state.currentTemplate) return elements;

      // 1. 添加模板基础图层（检查图层是否存在）
      if (Array.isArray(state.templateLayers)) {
        addTemplateLayers(elements);
      }

      // 2. 添加技能标题图层（优先于内容）
      if (Array.isArray(state.currentTemplate.verticalGroups)) {
        addSkillTitleLayers(elements);
      }

      // 3. 添加文本区域和技能内容
      if (Array.isArray(state.currentTemplate.textAreas)) {
        addTextAreas(elements);
      }
      if (Array.isArray(state.currentTemplate.verticalGroups)) {
        addVerticalGroups(elements);
      }

      // 4. 添加图片区域
      if (Array.isArray(state.currentTemplate.imageAreas)) {
        addImageAreas(elements);
      }

      // 按z-index排序（确保标题图层在正确层级）
      return elements.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    } catch (error) {
      console.error('收集元素时出错:', error);
      return [];
    }
  }

  /**
   * 辅助函数：添加技能标题图层
   * @param {Array} elements - 元素数组
   */
  function addSkillTitleLayers(elements) {
    (state.currentTemplate.verticalGroups || []).forEach(group => {
      group.items.forEach(skillItem => {
        if (skillItem.titleLayer) {
          elements.push({
            type: 'skill-title-layer',
            zIndex: skillItem.titleLayer.zIndex || 60,
            item: skillItem,
            groupX: group.x || 0,
            groupY: group.y || 0,
            groupWidth: group.width || 0,
            groupItems: group.items,
            groupSpacing: group.spacing || 15
          });
        }
      });
    });
  }

  /**
   * 添加模板图层到元素数组
   * @param {Array} elements - 元素数组
   */
  function addTemplateLayers(elements) {
    state.templateLayers.forEach(layer => {
      elements.push({
        type: 'template',
        zIndex: layer.zIndex || 0,
        layer: layer
      });
    });
  }

  /**
   * 添加文本区域到元素数组
   * @param {Array} elements - 元素数组
   */
  function addTextAreas(elements) {
    (state.currentTemplate.textAreas || []).forEach(area => {
      const zIndex = state.currentTemplate.contentLayers?.[area.layer] || 50;
      elements.push({
        type: 'text',
        zIndex: zIndex,
        area: area,
        content: state.userContent.textContent[area.id] || ''
      });
    });
  }

  /**
   * 添加垂直组到元素数组
   * @param {Array} elements - 元素数组
   */
  function addVerticalGroups(elements) {
    (state.currentTemplate.verticalGroups || []).forEach(group => {
      const zIndex = state.currentTemplate.contentLayers?.[group.layer] || 50;
      elements.push({
        type: 'vertical-group',
        zIndex: zIndex,
        group: group
      });
    });
  }

  /**
   * 添加图片区域到元素数组
   * @param {Array} elements - 元素数组
   */
  function addImageAreas(elements) {
    (state.currentTemplate.imageAreas || []).forEach(area => {
      if (state.userContent.imageContent[area.id]) {
        const zIndex = state.currentTemplate.contentLayers?.[area.layer] || 50;
        elements.push({
          type: 'image',
          zIndex: zIndex,
          area: area,
          image: state.userContent.imageContent[area.id],
          transforms: state.userContent.imageTransforms[area.id] || { x: 0, y: 0, scale: 1 }
        });
      }
    });
  }

  /**
   * 渲染所有元素
   * @param {Array} elements - 要渲染的元素数组
   */
  function renderAllElements(elements) {
    if (!elements || !Array.isArray(elements)) return;

    elements.forEach((element, index) => {
      try {
        switch(element.type) {
          case 'template':
            renderTemplateLayer(element.layer);
            break;
            
          case 'text':
            if (TextProcessor && typeof TextProcessor.renderText === 'function') {
              TextProcessor.renderText(element);
            }
            break;
            
          case 'vertical-group':
            if (TextProcessor && typeof TextProcessor.drawSkillGroup === 'function') {
              TextProcessor.drawSkillGroup(element.group);
            }
            break;
            
          case 'image':
            if (ImageProcessor && typeof ImageProcessor.renderImage === 'function') {
              ImageProcessor.renderImage(element);
            }
            break;
            
          case 'skill-title-layer':
            renderSkillTitleLayer(element);
            break;
        }
      } catch (error) {
        console.error(`渲染元素[${index}]时出错:`, error);
        // 继续渲染其他元素，而不是完全停止
      }
    });
  }

  /**
   * 渲染技能标题图层
   * @param {Object} element - 标题图层元素
   */
  function renderSkillTitleLayer(element) {
    const skillItem = element.item;
    const titleYPosition = calculateSkillTitleYPosition(
      element.groupY, 
      element.groupItems, 
      skillItem.id,
      element.groupSpacing
    );

    // 调用文本处理器绘制标题图层
    TextProcessor.drawSkillTitleLayer(
      skillItem.titleLayer,
      element.groupX,
      titleYPosition,
      skillItem.titleWidth || 100,
      skillItem.calculatedHeight || 0,
      skillItem.padding || {},
      skillItem.titleFontSize || 18,
      skillItem.titleFontWeight
    );
  }

  /**
   * 计算技能标题Y坐标
   * @param {number} groupY - 组Y坐标
   * @param {Array} groupItems - 组内项目
   * @param {string} targetItemId - 目标项目ID
   * @param {number} spacing - 项目间距
   * @returns {number} 标题Y坐标
   */
  function calculateSkillTitleYPosition(groupY, groupItems, targetItemId, spacing) {
    let currentY = groupY;
    
    for (const item of groupItems) {
      if (item.id === targetItemId) break;
      currentY += (item.calculatedHeight || 0) + spacing;
    }
    
    return currentY;
  }

  /**
   * 渲染模板图层
   * @param {Object} layer - 图层配置
   */
  function renderTemplateLayer(layer) {
    if (!layer.image) return;

    // 确保坐标和尺寸为有效数字
    const x = typeof layer.x === 'number' ? layer.x : 0;
    const y = typeof layer.y === 'number' ? layer.y : 0;
    const width = typeof layer.width === 'number' ? layer.width : layer.image.width;
    const height = typeof layer.height === 'number' ? layer.height : layer.image.height;

    // 绘制图层
    state.canvasCtx.drawImage(
      layer.image,
      x,  // 左上角x坐标
      y,  // 左上角y坐标
      width,
      height
    );
  }

  /**
   * 创建形状裁剪路径
   * @param {Object} area - 区域配置
   */
  function createShapeClipPath(area) {
    if (!state.canvasCtx) return;

    state.canvasCtx.save();
    state.canvasCtx.beginPath();

    const x = area.x || 0;
    const y = area.y || 0;
    const width = area.width || 0;
    const height = area.height || 0;

    // 根据形状创建路径
    switch(area.shape) {
      case 'rectangle':
        createRectanglePath(x, y, width, height);
        break;
        
      case 'diamond':
        createDiamondPath(x, y, width, height);
        break;
        
      case 'trapezoid':
        createTrapezoidPath(x, y, width, height, area.trapezoidParams);
        break;
        
      case 'circle':
        createCirclePath(x, y, width, height);
        break;
        
      default:
        // 默认使用矩形
        createRectanglePath(x, y, width, height);
    }

    state.canvasCtx.clip();
  }

  /**
   * 创建矩形路径
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  function createRectanglePath(x, y, width, height) {
    state.canvasCtx.rect(x, y, width, height);
  }

  /**
   * 创建菱形路径
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  function createDiamondPath(x, y, width, height) {
    state.canvasCtx.moveTo(x + width/2, y);
    state.canvasCtx.lineTo(x + width, y + height/2);
    state.canvasCtx.lineTo(x + width/2, y + height);
    state.canvasCtx.lineTo(x, y + height/2);
    state.canvasCtx.closePath();
  }

  /**
   * 创建梯形路径
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {Object} params - 梯形参数
   */
  function createTrapezoidPath(x, y, width, height, params) {
    const topWidth = params?.topWidth || width * 0.8;
    const topOffset = (width - topWidth) / 2;
    state.canvasCtx.moveTo(x + topOffset, y);
    state.canvasCtx.lineTo(x + width - topOffset, y);
    state.canvasCtx.lineTo(x + width, y + height);
    state.canvasCtx.lineTo(x, y + height);
    state.canvasCtx.closePath();
  }

  /**
   * 创建圆形路径
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  function createCirclePath(x, y, width, height) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const r = Math.min(width, height) / 2;
    state.canvasCtx.arc(cx, cy, r, 0, Math.PI * 2);
  }

  return {
    init,
    resizeCanvas,
    renderCard,
    createShapeClipPath
  };
})();
