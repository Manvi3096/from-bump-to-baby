document.getElementById("importFile").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const backup = JSON.parse(text);

    // Restore every key exactly as exported
    Object.keys(backup).forEach((key) => {
      localStorage.setItem(key, backup[key]);
    });

    // Verify kicks exist
    const kicksRaw = localStorage.getItem("kicksToday");

    if (kicksRaw) {
      try {
        const kicks = JSON.parse(kicksRaw);
        alert(`Backup imported successfully. Found ${kicks.length} kicks.`);
      } catch {
        alert("Backup imported but kicks format could not be verified.");
      }
    } else {
      alert("Backup imported but no kicksToday key was found.");
    }

    location.reload();

  } catch (err) {
    console.error(err);
    alert("Import failed. Please check the backup file.");
  }
};
