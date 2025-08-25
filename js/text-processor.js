const TextProcessor = (function() {
  let state, config, eventBus;
  const DEFAULT_LINE_HEIGHT_RATIO = 1.2;

  /**
   * 初始化函数
   * @param {Object} appState - 应用状态
   * @param {Object} appConfig - 应用配置
   * @param {Object} bus - 事件总线
   */
  function init(appState, appConfig, bus) {
    state = appState;
    config = appConfig;
    eventBus = bus;
  }

  /**
   * 渲染单个文本区域
   * @param {Object} element - 包含文本区域信息的对象
   */
  function renderText(element) {
    const textArea = element.area;
    return drawText(
      element.content, 
      textArea.x || 0, 
      textArea.y || 0, 
      textArea.width || 0, 
      textArea.height || 0, 
      textArea.fontSize || 16, 
      textArea.align || 'left',
      textArea.hasBackground || false,
      textArea.lockPosition,
      textArea.bgColor,
      textArea.fontFamily || 'Arial, sans-serif',  // 字体家族
      textArea.fontStyle || 'normal',              // 字体样式
      textArea.fontWeight || 'normal',             // 字重
      textArea.textColor || '#000000'            // 文本颜色
    );
  }

  /**
   * 计算文本所需高度
   * @param {string} text - 要计算的文本
   * @param {number} width - 文本容器宽度
   * @param {number} fontSize - 字体大小(px)
   * @param {number} [lineHeightRatio=DEFAULT_LINE_HEIGHT_RATIO] - 行高比例
   * @returns {number} 文本所需高度
   */
  function calculateTextHeight(text, width, fontSize, lineHeightRatio = DEFAULT_LINE_HEIGHT_RATIO) {
    if (!state.canvasCtx || !text || width <= 0) return 0;

    const lineHeight = fontSize * lineHeightRatio;
    const lines = splitTextIntoLines(text, width, fontSize, fontFamily);
    
    return lines.length * lineHeight;
  }

  /**
   * 将文本分割为适合容器宽度的行
   * @param {string} text - 要分割的文本
   * @param {number} width - 容器宽度
   * @param {number} fontSize - 字体大小
   * @returns {string[]} 分割后的行数组
   */
  function splitTextIntoLines(text, width, fontSize, fontFamily) {
    // 先按换行符分割
    const paragraphs = text.split(/\r\n|\r|\n/);
    const lines = [];
    
    state.canvasCtx.font = `${fontSize}px ${fontFamily}`;
    
    // 处理每个段落
    paragraphs.forEach(paragraph => {
      if (!paragraph) {
        lines.push(''); // 保留空行
        return;
      }
      
      const words = paragraph.split(' ');
      let line = '';
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const textMetrics = state.canvasCtx.measureText(testLine);
        
        if (textMetrics.width > width && i > 0) {
          lines.push(line.trim());
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }
      
      lines.push(line.trim());
    });
    
    return lines;
  }

  /**
   * 绘制文本到画布
   * @param {string} text - 要绘制的文本
   * @param {number} x - 起始X坐标
   * @param {number} y - 起始Y坐标
   * @param {number} width - 文本容器宽度
   * @param {number} maxHeight - 最大高度限制(可选)
   * @param {number} fontSize - 字体大小
   * @param {string} align - 对齐方式(left/center/right)
   * @param {boolean} hasBackground - 是否绘制背景
   * @param {string} lockPosition - 锁定位置(top/bottom)
   * @param {string} bgColor - 背景颜色
   * @returns {Object} 包含实际高度和行数的对象
   */
  function drawText(
    text, 
    x, 
    y, 
    width, 
    maxHeight, 
    fontSize, 
    align, 
    hasBackground, 
    lockPosition, 
    bgColor,
    fontFamily,  // 字体家族，默认Arial
    fontStyle,              // 字体样式，默认正常
    fontWeight,             // 字重，默认正常
    textColor            // 字体颜色，默认黑色
  ) {
    if (!state.canvasCtx || width <= 0) return { height: 0, lines: 0 };

    const displayText = text || '';
    const lineHeightRatio = DEFAULT_LINE_HEIGHT_RATIO;
    const lineHeight = fontSize * lineHeightRatio;
    
    // 设置文本样式 - 关键修改：使用传入的字体配置
    state.canvasCtx.fillStyle = textColor;  // 改为使用传入的文本颜色
    // 字体样式组合：样式 + 字重 + 大小 + 字体家族
    state.canvasCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    state.canvasCtx.textAlign = align || 'left';

    // 计算文本换行（保持原有逻辑）
    const lines = splitTextIntoLines(displayText, width, fontSize, fontFamily);
    const linesToDraw = maxHeight ? Math.floor(maxHeight / lineHeight) : lines.length;
    const actualHeight = Math.min(linesToDraw * lineHeight, maxHeight || Infinity);

    // 计算起始Y坐标（保持原有逻辑）
    let currentY = calculateStartY(y, fontSize, actualHeight, maxHeight, lockPosition);

    // 绘制背景（如果需要，保持原有逻辑）
    if (hasBackground) {
      drawTextBackground(x, currentY, width, actualHeight, fontSize, bgColor);
    }

    // 绘制文本（保持原有逻辑）
    drawTextLines(lines, linesToDraw, x, currentY, width, lineHeight, align);

    return { 
      height: actualHeight,
      lines: linesToDraw
    };
  }

  /**
   * 计算文本绘制的起始Y坐标
   * @param {number} baseY - 基础Y坐标
   * @param {number} fontSize - 字体大小
   * @param {number} actualHeight - 实际文本高度
   * @param {number} maxHeight - 最大高度限制
   * @param {string} lockPosition - 锁定位置
   * @returns {number} 计算后的起始Y坐标
   */
  function calculateStartY(baseY, fontSize, actualHeight, maxHeight, lockPosition) {
    let startY = baseY + fontSize;
    
    // 如果锁定到底部且有剩余空间，向上调整
    if (lockPosition === 'bottom' && maxHeight && actualHeight < maxHeight) {
      startY = baseY + maxHeight - actualHeight + (fontSize * 0.2);
    }
    
    return startY;
  }

  /**
   * 绘制文本背景
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} fontSize - 字体大小
   * @param {string} bgColor - 背景颜色
   */
  function drawTextBackground(x, y, width, height, fontSize, bgColor) {
    const padding = 5;
    const bgX = x - padding;
    const bgY = y - fontSize - padding;
    const bgWidth = width + padding * 2;
    const bgHeight = height + padding * 2;

    // 绘制背景
    state.canvasCtx.fillStyle = bgColor || config.textBgColor;
    state.canvasCtx.fillRect(bgX, bgY, bgWidth, bgHeight);

    // 绘制边框
    state.canvasCtx.strokeStyle = config.textBorderColor;
    state.canvasCtx.lineWidth = 1;
    state.canvasCtx.strokeRect(bgX, bgY, bgWidth, bgHeight);
  }

  /**
   * 绘制多行文本
   * @param {string[]} lines - 文本行数组
   * @param {number} linesToDraw - 要绘制的行数
   * @param {number} x - X坐标
   * @param {number} startY - 起始Y坐标
   * @param {number} width - 宽度
   * @param {number} lineHeight - 行高
   * @param {string} align - 对齐方式
   */
  function drawTextLines(lines, linesToDraw, x, startY, width, lineHeight, align) {
    let currentY = startY;
    
    for (let i = 0; i < linesToDraw; i++) {
      const lineText = lines[i] || '';
      const drawX = getAlignedX(x, width, align);
      
      state.canvasCtx.fillText(lineText, drawX, currentY);
      currentY += lineHeight;
    }
  }

  /**
   * 根据对齐方式计算X坐标
   * @param {number} baseX - 基础X坐标
   * @param {number} width - 宽度
   * @param {string} align - 对齐方式
   * @returns {number} 计算后的X坐标
   */
  function getAlignedX(baseX, width, align) {
    switch (align) {
      case 'center':
        return baseX + width / 2;
      case 'right':
        return baseX + width;
      default: // left
        return baseX;
    }
  }

  /**
   * 绘制技能组（垂直排列的多个文本项）
   * @param {Object} group - 技能组配置
   */
  function drawSkillGroup(group) {
    if (!group || !Array.isArray(group.items) || group.items.length === 0) return;

    let currentY = group.y || 0;
    const groupX = group.x || 0;
    const groupWidth = group.width || 0;
    const groupSpacing = group.spacing || 15;

    // 绘制每个技能项
    group.items.forEach(item => {
      if (!item.id) return;
      
      const itemHeight = drawSkillItem(item, groupX, currentY, groupWidth);
      currentY += itemHeight + groupSpacing;
    });
  }

// 修改TextProcessor中的标题尺寸计算逻辑

    /**
     * 绘制技能项 - 确保标题区域尺寸固定
     * @param {Object} skillItem - 技能项配置
     * @param {number} groupX - 组X坐标
     * @param {number} groupY - 组Y坐标
     * @param {number} groupWidth - 组宽度
     * @returns {number} 技能项高度
     */
    function drawSkillItem(skillItem, groupX, groupY, groupWidth) {
        try {
            // 基础配置与内容获取
            const itemContent = (state.userContent?.textContent?.[skillItem.id] || '')
            || skillItem.contentPlaceholder 
            || '';
            const titleWidth = skillItem.titleWidth || 100;
            const padding = getNormalizedPadding(skillItem.padding);
            const fontSize = skillItem.fontSize || 16;
            const titleFontSize = skillItem.titleFontSize || 18;

            // 关键修复：计算固定的标题区域高度（基于标题字体大小）
            // 不再依赖技能项整体高度，而是基于标题字体大小的固定值
            const fixedTitleHeight = titleFontSize * 1.8 + padding.top + padding.bottom;

            // 计算内容区域尺寸
            const contentAreaWidth = calculateContentAreaWidth(groupWidth, titleWidth, padding);
            const contentHeight = calculateContentHeight(itemContent, contentAreaWidth, fontSize);
            const totalContentHeight = contentHeight + padding.top + padding.bottom;

            // 技能项总高度取内容高度和固定标题高度中的最大值
            const itemTotalHeight = Math.max(totalContentHeight, fixedTitleHeight);

            // 绘制技能项背景
            if (skillItem.hasBackground) {
            drawSkillItemBackground(
                groupX, groupY, groupWidth, itemTotalHeight, padding, skillItem.bgColor
            );
            }

            // 绘制标题图层（使用固定高度）
            if (skillItem.titleLayer) {
            drawSkillTitleLayer(
                skillItem.titleLayer, 
                groupX, groupY, 
                titleWidth, 
                fixedTitleHeight,  // 关键修复：使用固定标题高度而非项目总高度
                padding, 
                titleFontSize,
                skillItem.titleFontWeight
            );
            }

            // 绘制技能内容
          const contentDrawResult = drawText(
            itemContent,
            groupX + titleWidth + padding.left,
            groupY + padding.top,
            contentAreaWidth,
            contentHeight,
            fontSize,
            'left',
            false, // 不使用背景
            null,  // 不锁定位置
            null,  // 无背景色
            skillItem.fontFamily || 'Arial, sans-serif',  // 新增：字体家族
            skillItem.fontStyle || 'normal',           // 新增：字体样式
            skillItem.fontWeight || 'normal',          // 新增：字重
            skillItem.textColor || '#000000'           // 新增：文本颜色
          );

            skillItem.calculatedHeight = itemTotalHeight;
            return itemTotalHeight;
        } catch (error) {
            console.error('绘制技能项时出错:', error);
            return 0;
        }
    }

  /**
   * 辅助函数：标准化留白配置（确保不出现undefined）
   * @param {Object} paddingConfig - 留白配置
   * @returns {Object} 标准化后的留白配置
   */
  function getNormalizedPadding(paddingConfig) {
    return {
      top: paddingConfig?.top || 0,
      right: paddingConfig?.right || 0,
      bottom: paddingConfig?.bottom || 0,
      left: paddingConfig?.left || 0
    };
  }

  /**
   * 辅助函数：计算内容区域宽度
   * @param {number} groupWidth - 组宽度
   * @param {number} titleWidth - 标题宽度
   * @param {Object} padding - 留白配置
   * @returns {number} 内容区域宽度
   */
  function calculateContentAreaWidth(groupWidth, titleWidth, padding) {
    return groupWidth - titleWidth - padding.left - padding.right;
  }

  /**
   * 辅助函数：计算内容高度
   * @param {string} content - 内容文本
   * @param {number} width - 内容区域宽度
   * @param {number} fontSize - 字体大小
   * @returns {number} 内容高度
   */
  function calculateContentHeight(content, width, fontSize) {
    return calculateTextHeight(content, width, fontSize);
  }

  /**
   * 辅助函数：计算标题高度
   * @param {number} titleFontSize - 标题字体大小
   * @returns {number} 标题高度
   */
  function calculateTitleHeight(titleFontSize) {
    return titleFontSize * DEFAULT_LINE_HEIGHT_RATIO;
  }

  /**
   * 绘制技能项背景（考虑留白）
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {Object} padding - 留白配置
   * @param {string} bgColor - 背景颜色
   */
  function drawSkillItemBackground(x, y, width, height, padding, bgColor) {
    const bgX = x + padding.left;
    const bgY = y + padding.top;
    const bgWidth = width - padding.left - padding.right;
    const bgHeight = height - padding.top - padding.bottom;

    // 绘制背景色
    state.canvasCtx.fillStyle = bgColor || config.textBgColor;
    state.canvasCtx.fillRect(bgX, bgY, bgWidth, bgHeight);

    // 绘制边框
    state.canvasCtx.strokeStyle = config.textBorderColor;
    state.canvasCtx.lineWidth = 1;
    state.canvasCtx.strokeRect(bgX, bgY, bgWidth, bgHeight);
  }

    /**
     * 绘制技能标题图层（使用固定高度）
     */
    function drawSkillTitleLayer(titleConfig, x, y, titleWidth, fixedTitleHeight, padding, fontSize, fontWeight) {
        // 标题区域坐标和尺寸（完全固定）
        const titleX = x + padding.left;
        const titleY = y + padding.top;
        const titleAreaWidth = titleWidth - padding.left - padding.right;
        const titleAreaHeight = fixedTitleHeight - padding.top - padding.bottom; // 使用固定高度

        // 绘制标题背景（图片或颜色）
        if (titleConfig.bgUrl) {
            drawTitleBackgroundImage(
            titleConfig.bgUrl, 
            titleConfig.bgColor,
            titleX, titleY,
            titleAreaWidth, titleAreaHeight, // 使用固定尺寸
            () => {
                drawTitleText(
                titleConfig.text, 
                titleX, titleY,
                titleAreaWidth, titleAreaHeight,
                fontSize, fontWeight
                );
            }
            );
        } else {
            drawTitleBackgroundColor(
            titleConfig.bgColor,
            titleX, titleY,
            titleAreaWidth, titleAreaHeight // 使用固定尺寸
            );
            drawTitleText(
            titleConfig.text, 
            titleX, titleY,
            titleAreaWidth, titleAreaHeight,
            fontSize, fontWeight
            );
        }
    }

    /**
     * 绘制标题背景图片（固定尺寸，不缩放）
     * @param {string} imageUrl - 图片URL
     * @param {string} fallbackColor - fallback颜色
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度（固定）
     * @param {number} height - 高度（固定）
     * @param {Function} onComplete - 完成回调
     */
    function drawTitleBackgroundImage(imageUrl, fallbackColor, x, y, width, height, onComplete) {
        const bgImage = new Image();
        bgImage.crossOrigin = 'Anonymous';
        
        // 图片加载成功
        bgImage.onload = () => {
            // 绘制图片，保持原始比例但适应固定区域
            const imgRatio = bgImage.width / bgImage.height;
            const targetRatio = width / height;
            
            let drawWidth, drawHeight, drawX = x, drawY = y;
            
            if (imgRatio > targetRatio) {
            // 图片更宽，按高度缩放
            drawHeight = height;
            drawWidth = bgImage.width * (height / bgImage.height);
            drawX = x + (width - drawWidth) / 2; // 水平居中
            } else {
            // 图片更高，按宽度缩放
            drawWidth = width;
            drawHeight = bgImage.height * (width / bgImage.width);
            drawY = y + (height - drawHeight) / 2; // 垂直居中
            }
            
            // 绘制图片，确保填充整个标题区域
            state.canvasCtx.drawImage(bgImage, drawX, drawY, drawWidth, drawHeight);
            onComplete();
        };
        
        // 图片加载失败（使用fallback颜色）
        bgImage.onerror = () => {
            console.warn(`标题背景图加载失败: ${imageUrl}，使用fallback颜色`);
            state.canvasCtx.fillStyle = fallbackColor || 'rgba(200, 200, 200, 0.8)';
            state.canvasCtx.fillRect(x, y, width, height);
            onComplete();
        };
        
        bgImage.src = imageUrl;
    }

  /**
   * 绘制标题背景色
   * @param {string} bgColor - 背景颜色
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  function drawTitleBackgroundColor(bgColor, x, y, width, height) {
    state.canvasCtx.fillStyle = bgColor || 'rgba(200, 200, 200, 0.8)';
    state.canvasCtx.fillRect(x, y, width, height);
  }

  /**
   * 绘制标题文字
   * @param {string} text - 标题文字
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} fontSize - 字体大小
   * @param {string} fontWeight - 字体粗细
   */
  function drawTitleText(text, x, y, width, height, fontSize, fontWeight = 'bold') {
    state.canvasCtx.fillStyle = '#000000';
    state.canvasCtx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
    state.canvasCtx.textAlign = 'center';
    state.canvasCtx.textBaseline = 'middle';
    state.canvasCtx.fillText(text, x + width/2, y + height/2);
  }

  /**
   * 绘制技能内容
   * @param {string} content - 内容文本
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 宽度
   * @param {number} fontSize - 字体大小
   * @returns {Object} 绘制结果
   */
  function drawSkillContent(content, x, y, width, fontSize) {
    return drawText(
      content,
      x, y,
      width,
      null, // 不限制最大高度
      fontSize,
      'left',
      false, // 不单独绘制背景
      null,
      null,
      fontFamily,           // 字体家族
      fontStyle,           // 字体样式
      fontWeight,         // 字重
      textColor,         // 文本颜色
    );
  }

  return {
    init,
    renderText,
    calculateTextHeight,
    drawText,
    drawSkillGroup
  };
})();
