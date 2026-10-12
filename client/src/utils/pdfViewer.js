/**
 * Universal PDF Viewer Utility
 * Safely opens a PDF Blob in a new browser tab.
 * Bypasses strict popup blockers by opening the window synchronously *before* the async request.
 *
 * @param {Function} fetchPdfPromise - An async function that returns the PDF Blob
 */
export const openPdfInNewTab = async (fetchPdfPromise) => {
  const newTab = window.open("", "_blank");

  if (!newTab) {
    throw new Error(
      "Popup blocked! Please allow popups for this site to view documents.",
    );
  }

  newTab.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Generating Document...</title>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f8fafc; margin: 0; }
          .container { text-align: center; color: #64748b; padding: 2rem; background: white; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
          .spinner { border: 4px solid #f1f5f9; border-top: 4px solid #f59e0b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
          h2 { color: #0f172a; margin: 0 0 8px 0; font-weight: 900; }
          p { margin: 0; font-size: 14px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h2>Generating Official Document</h2>
          <p>Please wait while we securely compile your PDF...</p>
        </div>
      </body>
    </html>
  `);

  try {
    const pdfBlob = await fetchPdfPromise();
    const fileURL = URL.createObjectURL(pdfBlob);

    newTab.location.replace(fileURL);

    setTimeout(() => {
      URL.revokeObjectURL(fileURL);
    }, 60000);
  } catch (error) {
    newTab.document.body.innerHTML = `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f8fafc; margin: 0;">
        <div style="text-align: center; max-width: 400px; padding: 32px; background: white; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #fee2e2;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background-color: #fef2f2; color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin: 0 auto 16px;">!</div>
          <h2 style="color: #0f172a; margin: 0 0 12px 0; font-weight: 900; font-size: 20px;">Document Generation Failed</h2>
          <p style="color: #64748b; margin: 0 0 24px 0; font-size: 14px; line-height: 1.5;">${error.message}</p>
          <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; transition: background 0.2s;">Close This Tab</button>
        </div>
      </div>
    `;
    throw error;
  }
};
