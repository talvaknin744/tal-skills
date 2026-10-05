export function renderLastUpload(container, timestamp) {
  container.textContent = timestamp ? `Last upload: ${timestamp}` : "No uploads yet";
}
