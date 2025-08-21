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
  function downloadCardWithBleed() {
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
      const newWidth = cardWidth + AppConfig.bleed.left + AppConfig.bleed.right;
      const newHeight = cardHeight + AppConfig.bleed.top + AppConfig.bleed.bottom;
      
      tempCanvas.width = newWidth;
      tempCanvas.height = newHeight;
      
      // 1. 绘制扩展背景（包含出血区域）
      tempCtx.fillStyle = config.solidColor;
      tempCtx.fillRect(0, 0, newWidth, newHeight);
      
      // 2. 绘制卡牌内容（偏移出血线位置）
      tempCtx.drawImage(
        state.canvas, 
        bleedSize, // x偏移
        bleedSize, // y偏移
        cardWidth, 
        cardHeight
      );
      
      // 3. 绘制出血线和裁切标记
      drawBleedElements(tempCtx, newWidth, newHeight, AppConfig.bleed, cardWidth, cardHeight);
      
      // 4. 执行下载
      const link = document.createElement('a');
      link.href = tempCanvas.toDataURL('image/png');
      const fileName = `${state.currentTemplate.name || 'card'}_with_bleed_${Date.now()}.png`;
      link.download = fileName;
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
    
    // 绘制出血区域边界（红色虚线）
    ctx.strokeStyle = config.bleedLineColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.rect(cardX, cardY, cardWidth, cardHeight);
    ctx.stroke();
    
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
    
    // 添加出血区域说明文字
    ctx.fillStyle = config.cropMarkColor;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    const textY = Math.max(bleedTop / 2, 10); // 确保文字可见
    ctx.fillText(
      `出血区域: 上${bleedTop}px 右${bleedRight}px 下${bleedBottom}px 左${bleedLeft}px`,
      canvasWidth / 2,
      textY
    );
  }
  
  return {
    init,
    downloadCardWithBleed
  };
})();
