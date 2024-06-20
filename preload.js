window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const dependency of ["chrome", "node", "electron"]) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }

  $(".win_close").on("click", () => {
    ipcRenderer.send("close-me");
  });
  $(".win_minimize").on("click", () => {
    ipcRenderer.send("minimize-me");
  });
});
