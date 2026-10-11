/**
 * Universal PDF Viewer Utility
 * Safely opens a PDF Blob in a new browser tab.
 * Bypasses strict popup blockers by opening the window synchronously *before* the async request,
 * providing a seamless loading experience.
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
    <html>
      <head>
        <title>Generating Document...</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f8fafc; margin: 0; }
          .container { text-align: center; color: #64748b; }
          .spinner { border: 4px solid #f1f5f9; border-top: 4px solid #f59e0b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
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

    newTab.location.href = fileURL;

    setTimeout(() => {
      URL.revokeObjectURL(fileURL);
    }, 60000);
  } catch (error) {
    newTab.document.body.innerHTML = `
      <div style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; background-color: #fef2f2; color: #ef4444; padding: 20px;">
        <div>
          <h2 style="font-weight: 900; margin-bottom: 8px;">Document Generation Failed</h2>
          <p style="color: #991b1b;">${error.message}</p>
        </div>
      </div>
    `;
    throw error;
  }
};
