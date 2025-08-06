import QRCode from 'qrcode';

/**
 * SVGテンプレートを使用して動的にデザインを生成するクラス
 */
export class SvgTemplateRenderer {
  constructor() {
    this.templateCache = new Map();
  }

  /**
   * SVGテンプレートを読み込む
   * @param {string} templatePath - テンプレートファイルのパス
   * @returns {Promise<string>} SVGテンプレート文字列
   */
  async loadTemplate(templatePath) {
    if (this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath);
    }

    try {
      const response = await fetch(templatePath);
      const template = await response.text();
      this.templateCache.set(templatePath, template);
      return template;
    } catch (error) {
      console.error('SVGテンプレートの読み込みに失敗:', error);
      throw error;
    }
  }

  /**
   * QRコードをBase64データURLとして生成
   * @param {string} text - QRコードにエンコードするテキスト
   * @param {object} options - QRコード生成オプション
   * @returns {Promise<string>} Base64データURL
   */
  async generateQRCodeDataUrl(text, options = {}) {
    const defaultOptions = {
      width: 910,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M',
      type: 'image/png',
      ...options
    };

    try {
      return await QRCode.toDataURL(text, defaultOptions);
    } catch (error) {
      console.error('QRコード生成に失敗:', error);
      throw error;
    }
  }

  /**
   * 画像をBase64データURLに変換
   * @param {string|File} imageSource - 画像のURLまたはFileオブジェクト
   * @param {number} maxWidth - 最大幅
   * @param {number} maxHeight - 最大高さ
   * @returns {Promise<string>} Base64データURL
   */
  async convertImageToDataUrl(imageSource, maxWidth = 300, maxHeight = 150) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // アスペクト比を維持してリサイズ
        const aspectRatio = img.width / img.height;
        let newWidth = maxWidth;
        let newHeight = maxHeight;
        
        if (aspectRatio > maxWidth / maxHeight) {
          newHeight = maxWidth / aspectRatio;
        } else {
          newWidth = maxHeight * aspectRatio;
        }
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // 高品質設定
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      
      if (imageSource instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.readAsDataURL(imageSource);
      } else {
        img.src = imageSource;
      }
    });
  }

  /**
   * SVGテンプレートのプレースホルダーを置換
   * @param {string} template - SVGテンプレート文字列
   * @param {object} variables - 置換変数オブジェクト
   * @returns {string} 置換済みSVG文字列
   */
  replacePlaceholders(template, variables) {
    let result = template;
    
    // デフォルト値の設定
    const defaults = {
      // QRコード
      QR_CODE_DATA: '',
      
      // 背景
      BACKGROUND_IMAGE: '',
      BACKGROUND_FILL: 'url(#defaultBg)',
      
      // ロゴ
      LOGO_IMAGE: '',
      LOGO_OPACITY: '0',
      
      // テキスト
      MAIN_TEXT: 'アンケートにご協力ください',
      SUB_TEXT: '',
      TEXT_SIZE: '100',
      SUB_TEXT_SIZE: '60',
      TEXT_COLOR: '#374151',
      SUB_TEXT_COLOR: '#6b7280',
      SUB_TEXT_OPACITY: '0',
      
      // 装飾
      DECORATION_OPACITY: '1',
      BORDER_COLOR: '#e2e8f0',
      BORDER_WIDTH: '0',
      BORDER_DASH: 'none',
      BORDER_OPACITY: '0'
    };

    const finalVariables = { ...defaults, ...variables };

    // プレースホルダーを置換
    Object.keys(finalVariables).forEach(key => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), finalVariables[key]);
    });

    return result;
  }

  /**
   * SVGを高解像度PNGに変換
   * @param {string} svgString - SVG文字列
   * @param {number} scale - スケール倍率（デフォルト: 1）
   * @returns {Promise<Blob>} PNG画像のBlob
   */
  async svgToPng(svgString, scale = 1) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // 高品質設定
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        if (scale !== 1) {
          ctx.scale(scale, scale);
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(resolve, 'image/png');
      };
      
      img.onerror = () => reject(new Error('SVGの変換に失敗しました'));
      
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
    });
  }

  /**
   * 完全なデザイン生成とダウンロード
   * @param {object} config - 設定オブジェクト
   * @returns {Promise<void>}
   */
  async generateAndDownload(config) {
    try {
      // 1. SVGテンプレート読み込み
      const template = await this.loadTemplate('/src/assets/templates/design-template.svg');
      
      // 2. QRコード生成
      const qrCodeDataUrl = await this.generateQRCodeDataUrl(config.qrText || '');
      
      // 3. 各種画像の準備
      const variables = {
        QR_CODE_DATA: qrCodeDataUrl,
        MAIN_TEXT: config.mainText || 'アンケートにご協力ください',
        SUB_TEXT: config.subText || '',
        TEXT_SIZE: config.textSize || '100',
        SUB_TEXT_SIZE: config.subTextSize || '60',
        TEXT_COLOR: config.textColor || '#374151',
        SUB_TEXT_COLOR: config.subTextColor || '#6b7280',
        SUB_TEXT_OPACITY: config.subText ? '1' : '0',
        DECORATION_OPACITY: config.showDecorations ? '1' : '0.5'
      };

      // 4. ロゴ画像の処理
      if (config.logoImage) {
        const logoDataUrl = await this.convertImageToDataUrl(config.logoImage, 300, 150);
        variables.LOGO_IMAGE = logoDataUrl;
        variables.LOGO_OPACITY = '1';
      }

      // 5. 背景画像の処理
      if (config.backgroundImage) {
        const bgDataUrl = await this.convertImageToDataUrl(config.backgroundImage, 2149, 1299);
        variables.BACKGROUND_IMAGE = bgDataUrl;
        variables.BACKGROUND_FILL = 'url(#backgroundImage)';
      }

      // 6. SVG生成
      const finalSvg = this.replacePlaceholders(template, variables);
      
      // 7. PNG変換とダウンロード
      const pngBlob = await this.svgToPng(finalSvg, 1);
      const url = URL.createObjectURL(pngBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.filename || 'design'}.png`;
      link.click();
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('デザイン生成に失敗:', error);
      throw error;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const svgRenderer = new SvgTemplateRenderer();