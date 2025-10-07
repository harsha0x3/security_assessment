import { getCSRFToken } from "./csrf";

export async function downloadFile(url, filename) {
  try {
    const csrf_token = getCSRFToken;
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "X-CSRFToken": csrf_token,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    const blob = await response.blob();
    const href = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(href);
  } catch (error) {
    console.error("Download failed:", error);
  }
}
