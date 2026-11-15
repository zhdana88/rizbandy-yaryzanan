/**
 * Mobile & WebView-resilient Image Export and Download Helper
 * Supports direct Blob URL / Object URL download (Android/iOS/Desktop),
 * Base64 binary decoding without fetch limitations,
 * Web Share API for saving to Gallery/WhatsApp,
 * and Capacitor Filesystem native storage.
 */

export interface ExportImageOptions {
  canvasOrDataUrl: HTMLCanvasElement | string;
  fileName: string;
  title?: string;
  text?: string;
  action?: 'download' | 'share';
}

export interface ExportImageResult {
  success: boolean;
  method?: 'download' | 'share' | 'capacitor' | 'window' | 'blob';
  error?: any;
}

/**
 * Converts DataURL to Blob safely and synchronously using pure Uint8Array
 * bypassing any fetch() limits on large 2x/3x retina images.
 */
export function dataURLToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    const byteCharacters = atob(dataUrl.substring(dataUrl.indexOf(',') + 1));
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/png' });
  }
}

/**
 * Direct file download trigger using Object URL / Blob
 */
export function triggerBlobDownload(blob: Blob, fileName: string): boolean {
  try {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.setAttribute('download', fileName);
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';

    // Must be appended to body for Android Chrome and mobile webviews
    document.body.appendChild(link);
    link.click();

    // Cleanup after delay
    setTimeout(() => {
      try {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      } catch (_) {}
    }, 1500);

    return true;
  } catch (err) {
    console.error('triggerBlobDownload error:', err);
    return false;
  }
}

/**
 * Universal Mobile & Desktop Canvas/Image Export
 */
export async function exportCanvasImageMobile(
  options: ExportImageOptions
): Promise<ExportImageResult> {
  const { canvasOrDataUrl, fileName, title, text, action = 'download' } = options;

  try {
    let dataUrl: string;
    let blob: Blob;

    if (typeof canvasOrDataUrl === 'string') {
      dataUrl = canvasOrDataUrl;
      blob = dataURLToBlob(dataUrl);
    } else {
      dataUrl = canvasOrDataUrl.toDataURL('image/png', 1.0);
      const b = await new Promise<Blob | null>((resolve) => {
        if (canvasOrDataUrl.toBlob) {
          canvasOrDataUrl.toBlob(resolve, 'image/png', 1.0);
        } else {
          resolve(dataURLToBlob(dataUrl));
        }
      });
      blob = b || dataURLToBlob(dataUrl);
    }

    // 1. Check Capacitor Native runtime (if running in Capacitor Android/iOS App)
    const cap = (window as any).Capacitor;
    if (cap?.isNativePlatform && cap.isNativePlatform()) {
      try {
        if (cap.Plugins?.Filesystem) {
          const base64Data = dataUrl.split(',')[1] || dataUrl;
          const writeRes = await cap.Plugins.Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: 'DOCUMENTS',
            recursive: true,
          });

          if (action === 'share' && cap.Plugins?.Share) {
            await cap.Plugins.Share.share({
              title: title || 'Rizbandy Export',
              text: text || 'وێنەی خشتەی ڕیزبەندی و پێکهاتە',
              url: writeRes.uri,
            });
            return { success: true, method: 'capacitor' };
          }
          return { success: true, method: 'capacitor' };
        }
      } catch (capErr) {
        console.warn('Capacitor native export failed, falling back to Blob/Share', capErr);
      }
    }

    // 2. If explicit 'share' action was requested on Mobile, use Web Share API
    const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (action === 'share' && isMobileDevice && navigator.canShare) {
      try {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: title || 'ڕیزبەندی',
            text: text || 'وێنەی داتاکانی خولەکە',
          });
          return { success: true, method: 'share' };
        }
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          return { success: true, method: 'share' };
        }
        console.warn('WebShare cancelled or failed, falling back to Blob download', shareErr);
      }
    }

    // 3. Primary High-Reliability Blob URL Download
    const downloadOk = triggerBlobDownload(blob, fileName);
    if (downloadOk) {
      return { success: true, method: 'download' };
    }

    // 4. Fallback for restricted WebViews / iframes: direct dataURL link
    const fallbackLink = document.createElement('a');
    fallbackLink.href = dataUrl;
    fallbackLink.download = fileName;
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    setTimeout(() => {
      if (fallbackLink.parentNode) {
        document.body.removeChild(fallbackLink);
      }
    }, 1000);

    return { success: true, method: 'download' };
  } catch (err: any) {
    console.error('Error during image export:', err);

    // 5. Ultimate fallback: open in new window/tab for user to long-press and save
    if (typeof canvasOrDataUrl === 'string') {
      try {
        const w = window.open();
        if (w) {
          w.document.write(
            `<html><head><title>${fileName}</title></head><body style="margin:0;display:flex;justify-content:center;background:#0f172a;"><img src="${canvasOrDataUrl}" style="max-width:100%;height:auto;" /></body></html>`
          );
          return { success: true, method: 'window' };
        }
      } catch (_) {}
    }

    return { success: false, method: 'download', error: err?.message || err || 'Download error' };
  }
}

