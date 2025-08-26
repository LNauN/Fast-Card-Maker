const ExportManager = (function() {
  let state, config, eventBus;
  
  // 初始化模块
  function init(appState, appConfig, bus) {
    state = appState;
    config = appConfig;
    eventBus = bus;
    bindEventListeners();
  }
  
  // 绑定事件监听器
  function bindEventListeners() {
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', downloadCardWithBleed);
    }
  }
  
  // 下载带出血线的卡牌
  async function downloadCardWithBleed() {
    if (!state.currentTemplate || !state.canvas) return;
    
    try {
      // 创建临时画布
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        console.error('无法创建临时画布上下文');
        return;
      }
      
      // 计算出血区域尺寸
      const cardWidth = state.currentTemplate.width || 600;
      const cardHeight = state.currentTemplate.height || 800;
      const bleedSize = cardWidth * config.bleedRatio;
      const { top: bleedTop, right: bleedRight, bottom: bleedBottom, left: bleedLeft } = AppConfig.bleed;
      const totalWidth = cardWidth + bleedLeft + bleedRight;
      const totalHeight = cardHeight + bleedTop + bleedBottom;
      
      tempCanvas.width = totalWidth;
      tempCanvas.height = totalHeight;
      
      // 1.绘制出血区域背景
      // 获取模板配置的出血背景
      const { bleedBackground } = state.currentTemplate || {};
      
      if (bleedBackground?.url) {
        // 加载并绘制模板指定的背景图（异步操作）
        await new Promise((resolve) => {
          const bgImg = new Image();
          bgImg.crossOrigin = 'Anonymous';
          
          // 图片加载成功：按配置绘制
          bgImg.onload = () => {
            tempCtx.save();
            if (bleedBackground.fillMode === 'cover') {
              // 覆盖模式：拉伸填满出血区域
              tempCtx.drawImage(bgImg, 0, 0, totalWidth, totalHeight);
            } else if (bleedBackground.repeat) {
              // 重复模式：平铺图片
              const pattern = tempCtx.createPattern(bgImg, 'repeat');
              tempCtx.fillStyle = pattern;
              tempCtx.fillRect(0, 0, totalWidth, totalHeight);
            } else {
              // 包含模式：保持比例居中（默认）
              const imgRatio = bgImg.width / bgImg.height;
              const targetRatio = totalWidth / totalHeight;
              let drawWidth, drawHeight, x = 0, y = 0;
              
              if (imgRatio > targetRatio) {
                drawWidth = totalWidth;
                drawHeight = totalWidth / imgRatio;
                y = (totalHeight - drawHeight) / 2;
              } else {
                drawHeight = totalHeight;
                drawWidth = totalHeight * imgRatio;
                x = (totalWidth - drawWidth) / 2;
              }
              tempCtx.drawImage(bgImg, x, y, drawWidth, drawHeight);
            }
            tempCtx.restore();
            resolve();
          };
          
          // 图片加载失败：使用原有纯色背景兜底
          bgImg.onerror = () => {
            console.warn(`模板背景图加载失败，使用默认纯色: ${bleedBackground.url}`);
            tempCtx.fillStyle = AppConfig.solidColor;
            tempCtx.fillRect(0, 0, totalWidth, totalHeight);
            resolve();
          };
          
          bgImg.src = bleedBackground.url;
        });
      } else {
        // 无配置背景图：使用原有纯色背景（保持原逻辑）
        tempCtx.fillStyle = AppConfig.solidColor;
        tempCtx.fillRect(0, 0, totalWidth, totalHeight);
      }
      
      // 2. 绘制卡牌内容（偏移出血线位置）
      tempCtx.drawImage(
        state.canvas, 
        bleedLeft,  // x坐标：左出血宽度
        bleedTop,   // y坐标：上出血宽度
        cardWidth, 
        cardHeight
      );
      
      // 3. 绘制出血线和裁切标记
      drawBleedElements(tempCtx, totalWidth, totalHeight, AppConfig.bleed, cardWidth, cardHeight);
      
      // 4. 执行下载
      const link = document.createElement('a');
      link.download = `card-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
      
      // 清理临时资源
      setTimeout(() => tempCanvas.remove(), 100);
    } catch (error) {
      console.error('下载卡牌时出错:', error);
      alert('下载失败，请重试');
    }
  }
  
  // 绘制出血线和裁切标记
  function drawBleedElements(ctx, canvasWidth, canvasHeight, bleed, cardWidth, cardHeight) {
    // 使用四个方向的出血值
    const { top: bleedTop, right: bleedRight, bottom: bleedBottom, left: bleedLeft } = bleed;
    const cardX = bleedLeft;
    const cardY = bleedTop;
    const markLength = Math.max(Math.max(bleedTop, bleedRight, bleedBottom, bleedLeft) / 2, 5);
    
    /* 
    // 绘制出血区域边界（红色虚线）
    ctx.strokeStyle = config.bleedLineColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.rect(cardX, cardY, cardWidth, cardHeight);
    ctx.stroke();
    */
    
    // 绘制裁切标记（四角的实线标记）
    ctx.strokeStyle = config.cropMarkColor;
    ctx.setLineDash([]); // 实线
    ctx.lineWidth = 1;
    
    // 左上角标记
    ctx.beginPath();
    ctx.moveTo(cardX - markLength, cardY);
    ctx.lineTo(cardX, cardY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cardX, cardY - markLength);
    ctx.lineTo(cardX, cardY);
    ctx.stroke();
    
    // 右上角标记
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth, cardY);
    ctx.lineTo(cardX + cardWidth + markLength, cardY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth, cardY - markLength);
    ctx.lineTo(cardX + cardWidth, cardY);
    ctx.stroke();
    
    // 左下角标记
    ctx.beginPath();
    ctx.moveTo(cardX - markLength, cardY + cardHeight);
    ctx.lineTo(cardX, cardY + cardHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cardX, cardY + cardHeight);
    ctx.lineTo(cardX, cardY + cardHeight + markLength);
    ctx.stroke();
    
    // 右下角标记
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth, cardY + cardHeight);
    ctx.lineTo(cardX + cardWidth + markLength, cardY + cardHeight);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(cardX + cardWidth, cardY + cardHeight);
    ctx.lineTo(cardX + cardWidth, cardY + cardHeight + markLength);
    ctx.stroke();
  }

  // 绘制出血背景
  function drawBleedBackground(ctx, canvasWidth, canvasHeight, bleed, cardWidth, cardHeight, template) {
    if (!template.bleedBackground || !template.bleedBackground.url) return;

    const { top: bleedTop, right: bleedRight, bottom: bleedBottom, left: bleedLeft } = bleed;
    // 计算包含出血线的总尺寸（实际导出图片的尺寸）
    const totalWidth = cardWidth + bleedLeft + bleedRight;
    const totalHeight = cardHeight + bleedTop + bleedBottom;

    return new Promise((resolve) => {
      const bgImg = new Image();
      bgImg.crossOrigin = 'Anonymous';
      bgImg.onload = () => {
        ctx.save();
        
        // 根据填充模式绘制背景
        if (template.bleedBackground.fillMode === 'cover') {
          // 覆盖模式：拉伸图片填满整个出血区域
          ctx.drawImage(bgImg, 0, 0, totalWidth, totalHeight);
        } else if (template.bleedBackground.repeat) {
          // 重复模式：平铺图片
          const pattern = ctx.createPattern(bgImg, 'repeat');
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, totalWidth, totalHeight);
        } else {
          // 包含模式：保持比例，居中显示（适合需要完整展示的背景）
          const imgRatio = bgImg.width / bgImg.height;
          const targetRatio = totalWidth / totalHeight;
          let drawWidth, drawHeight, x, y;
          
          if (imgRatio > targetRatio) {
            drawWidth = totalWidth;
            drawHeight = totalWidth / imgRatio;
            y = (totalHeight - drawHeight) / 2;
            x = 0;
          } else {
            drawHeight = totalHeight;
            drawWidth = totalHeight * imgRatio;
            x = (totalWidth - drawWidth) / 2;
            y = 0;
          }
          ctx.drawImage(bgImg, x, y, drawWidth, drawHeight);
        }
        
        ctx.restore();
        resolve();
      };
      // 背景图加载失败时用纯色兜底（避免白边）
      bgImg.onerror = () => {
        console.warn(`出血背景加载失败: ${template.bleedBackground.url}`);
        ctx.fillStyle = '#ffffff'; // 用模板主色兜底
        ctx.fillRect(0, 0, totalWidth, totalHeight);
        resolve();
      };
      bgImg.src = template.bleedBackground.url;
    });
  }
  
  return {
    init,
    downloadCardWithBleed,
    drawBleedBackground
  };
})();
